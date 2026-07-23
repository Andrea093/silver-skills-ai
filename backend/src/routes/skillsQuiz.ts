import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { detectProfession, detectSpecialty, GENERAL_PROFILE, ProfessionProfile, Specialty } from "../data/professionProfiles";
import { parseCvSections } from "../services/cvParser";

export const skillsQuizRouter = Router();

// Same profession/specialty detection precedence as skillsUpdate.ts and transition.ts: prefer the
// latest CV's own text/headline, fall back to the latest assessment's free-text experience answer,
// else the general profile.
async function detectProfileAndSpecialty(userId: string): Promise<{ profile: ProfessionProfile; specialty: Specialty | null }> {
  const latestCv = await prisma.cvAnalysis.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  let profile: ProfessionProfile;
  let rawText = "";
  let headline: string | undefined;

  if (latestCv) {
    const parsed = parseCvSections(latestCv.rawText);
    rawText = latestCv.rawText;
    headline = parsed.headline;
    profile = detectProfession(rawText, headline);
  } else {
    const latestAssessment = await prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    const answers = latestAssessment ? JSON.parse(latestAssessment.answers) : null;
    rawText = answers?.experienceText || "";
    profile = rawText ? detectProfession(rawText) : GENERAL_PROFILE;
  }

  const specialty = detectSpecialty(profile, rawText, headline);
  return { profile, specialty };
}

skillsQuizRouter.get("/", requireAuth, async (req, res) => {
  const { profile, specialty } = await detectProfileAndSpecialty(req.userId!);
  res.json({
    professionLabel: profile.label,
    // correctIndex is deliberately stripped before sending, so the answer key never reaches the client.
    behaviorQuestions: profile.behaviorQuestions.map(({ skill, question, options }) => ({ skill, question, options })),
    specialtyLabel: specialty?.label ?? null,
    knowledgeQuestions: specialty
      ? specialty.knowledgeQuestions.map(({ skill, question, options }) => ({ skill, question, options }))
      : [],
  });
});

const submitSchema = z.object({
  dimension: z.enum(["general", "disciplinary"]),
  answers: z.array(z.object({ skill: z.string(), selectedIndex: z.number().int().min(0) })),
});

skillsQuizRouter.post("/submit", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  // Re-detect server-side and re-score against the real question bank — never trust a level/score
  // sent by the client, only which option index they picked for a named question.
  const { profile, specialty } = await detectProfileAndSpecialty(req.userId!);
  const levelsToSave: { skill: string; level: number }[] = [];

  if (parsed.data.dimension === "general") {
    for (const answer of parsed.data.answers) {
      const question = profile.behaviorQuestions.find((q) => q.skill === answer.skill);
      if (!question) continue;
      const maxIdx = question.options.length - 1;
      const clampedIndex = Math.max(0, Math.min(maxIdx, answer.selectedIndex));
      const level = Math.round(25 + (clampedIndex / maxIdx) * 65); // 5-option BARS scale -> 25/41/58/74/90
      levelsToSave.push({ skill: answer.skill, level });
    }
  } else {
    if (!specialty) return res.status(400).json({ error: "No se detectó una especialidad para calificar" });
    for (const answer of parsed.data.answers) {
      const question = specialty.knowledgeQuestions.find((q) => q.skill === answer.skill);
      if (!question) continue;
      const level = answer.selectedIndex === question.correctIndex ? 85 : 30;
      levelsToSave.push({ skill: answer.skill, level });
    }
  }

  for (const { skill, level } of levelsToSave) {
    const existing = await prisma.skill.findFirst({ where: { userId: req.userId!, name: skill } });
    if (existing) {
      await prisma.skill.update({ where: { id: existing.id }, data: { level } });
    } else {
      await prisma.skill.create({ data: { userId: req.userId!, name: skill, level } });
    }
  }

  res.json({ ok: true, updated: levelsToSave.length });
});
