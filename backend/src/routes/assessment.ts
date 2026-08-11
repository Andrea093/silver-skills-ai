import { Router } from "express";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { computeAssessment, heuristicSummary, scoreBarsAnswer, WIZARD_STEPS, AssessmentAnswers } from "../services/assessmentScoring";
import { detectProfession, CENTURY21_BEHAVIOR_QUESTIONS, BehaviorQuestion } from "../data/professionProfiles";
import { env, isMentorAgentEnabled } from "../lib/env";

export const assessmentRouter = Router();

assessmentRouter.get("/steps", (_req, res) => {
  res.json({ steps: WIZARD_STEPS });
});

const detectSkillsSchema = z.object({
  experienceText: z.string().min(1),
  cvExtractedSkills: z.array(z.string()).optional(),
});

assessmentRouter.post("/detect-skills", requireAuth, async (req, res) => {
  const parsed = detectSkillsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  // Real, field-specific growth areas instead of the same generic 6-item list for everyone —
  // detected the same way as everything else here, from the person's own text.
  const profile = detectProfession(parsed.data.experienceText);
  res.json({
    professionLabel: profile.label,
    interestOptions: profile.interestAreas,
    // Role-specific BARS questions (profession detected from the free text) plus the universal
    // 21st-century-skills bank — situational/frequency questions, never a self-rated percentage.
    // correctIndex doesn't apply to BehaviorQuestion (no right answer), nothing to strip.
    behaviorQuestions: [...profile.behaviorQuestions, ...CENTURY21_BEHAVIOR_QUESTIONS],
    // Skills the CV parser found literally listed in the document — real evidence of what the
    // person wrote, but with no percentage attached, since we haven't actually measured them.
    cvSkillNames: parsed.data.cvExtractedSkills || [],
  });
});

const submitSchema = z.object({
  experienceText: z.string().min(1),
  quizAnswers: z.array(z.object({ skill: z.string(), selectedIndex: z.number().int().min(0) })),
  interests: z.array(z.string()),
  goal: z.string(),
  weeklyHours: z.number().min(0).max(40),
});

assessmentRouter.post("/", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const submitted = parsed.data;

  // Re-detect profession server-side and re-score against the real question bank — never trust a
  // level sent by the client, only which option index they picked for a named question (same
  // principle as skillsQuiz.ts).
  const profile = detectProfession(submitted.experienceText);
  const questionBank: BehaviorQuestion[] = [...profile.behaviorQuestions, ...CENTURY21_BEHAVIOR_QUESTIONS];
  const currentSkills = submitted.quizAnswers
    .map((answer) => {
      const question = questionBank.find((q) => q.skill === answer.skill);
      if (!question) return null;
      return { name: answer.skill, level: scoreBarsAnswer(answer.selectedIndex, question.options.length) };
    })
    .filter((s): s is { name: string; level: number } => s !== null);

  const answers: AssessmentAnswers = {
    experienceText: submitted.experienceText,
    currentSkills,
    interests: submitted.interests,
    goal: submitted.goal,
    weeklyHours: submitted.weeklyHours,
  };
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
            content: `Un adulto 50+ en LATAM describió su trayectoria así: "${answers.experienceText}". Sus niveles de habilidad medidos con un cuestionario real: ${answers.currentSkills
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
