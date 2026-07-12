import { Router } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { computeAssessment, heuristicSummary, detectSkillLevels, WIZARD_STEPS } from "../services/assessmentScoring";
import { parseCvSections } from "../services/cvParser";
import { env, isMentorAgentEnabled } from "../lib/env";

export const assessmentRouter = Router();

assessmentRouter.get("/steps", (_req, res) => {
  res.json({ steps: WIZARD_STEPS });
});

const detectSkillsSchema = z.object({
  experienceText: z.string().min(1),
  cvExtractedSkills: z.array(z.string()).optional(),
  cvAnalysisId: z.string().optional(),
});

assessmentRouter.post("/detect-skills", requireAuth, async (req, res) => {
  const parsed = detectSkillsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  let cvExperience: ReturnType<typeof parseCvSections>["experience"] = [];
  if (parsed.data.cvAnalysisId) {
    const cv = await prisma.cvAnalysis.findFirst({
      where: { id: parsed.data.cvAnalysisId, userId: req.userId! },
    });
    if (cv) cvExperience = parseCvSections(cv.rawText).experience;
  }

  const skills = detectSkillLevels(parsed.data.experienceText, parsed.data.cvExtractedSkills || [], cvExperience);
  res.json({ skills });
});

const submitSchema = z.object({
  experienceText: z.string().min(1),
  currentSkills: z.array(z.object({ name: z.string(), level: z.number().min(0).max(100) })),
  interests: z.array(z.string()),
  goal: z.string(),
  weeklyHours: z.number().min(0).max(40),
});

assessmentRouter.post("/", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const answers = parsed.data;
  const computed = computeAssessment(answers);

  let summary = heuristicSummary(answers, computed);
  if (isMentorAgentEnabled()) {
    try {
      const client = new Anthropic({ apiKey: env.anthropicApiKey });
      const message = await client.messages.create({
        model: "claude-sonnet-5",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Un adulto 50+ en LATAM describió su trayectoria así: "${answers.experienceText}". Sus niveles de habilidad autoevaluados: ${answers.currentSkills
              .map((s) => `${s.name}=${s.level}%`)
              .join(", ")}. Riesgo de automatización calculado: ${computed.automationRisk}%. Potencial de adaptación: ${computed.adaptationPotential}%. Escribe un resumen breve (3-4 líneas, en español, tono motivador) de sus fortalezas y oportunidades de transición profesional.`,
          },
        ],
      });
      const textBlock = message.content.find((b) => b.type === "text");
      if (textBlock && textBlock.type === "text") summary = textBlock.text.trim();
    } catch {
      // keep heuristic summary on API failure
    }
  }

  await prisma.$transaction([
    prisma.skill.deleteMany({ where: { userId: req.userId! } }),
    prisma.skill.createMany({
      data: computed.resultSkills.map((s) => ({ userId: req.userId!, name: s.name, level: s.level })),
    }),
    prisma.assessment.create({
      data: {
        userId: req.userId!,
        answers: JSON.stringify(answers),
        resultSkills: JSON.stringify(computed.resultSkills),
        automationRisk: computed.automationRisk,
        adaptationPotential: computed.adaptationPotential,
        summary,
      },
    }),
    prisma.user.update({
      where: { id: req.userId! },
      data: { employabilityScore: computed.employabilityScore },
    }),
  ]);

  res.json({ ...computed, summary });
});

assessmentRouter.get("/latest", requireAuth, async (req, res) => {
  const latest = await prisma.assessment.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return res.status(404).json({ error: "Sin evaluaciones aún" });
  res.json({
    resultSkills: JSON.parse(latest.resultSkills),
    automationRisk: latest.automationRisk,
    adaptationPotential: latest.adaptationPotential,
    summary: latest.summary,
    createdAt: latest.createdAt,
  });
});
