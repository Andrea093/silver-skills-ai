import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { detectProfession, GENERAL_PROFILE, ProfessionProfile } from "../data/professionProfiles";
import { parseCvSections } from "../services/cvParser";
import { dedupeCaseInsensitive } from "../services/cvGenerator";
import { searchCoursesByTopic } from "../services/courseCatalog";

export const skillsUpdateRouter = Router();

const MAX_ENRICHED_GAPS = 6;

skillsUpdateRouter.get("/", requireAuth, async (req, res) => {
  const skills = await prisma.skill.findMany({ where: { userId: req.userId! } });
  const latestCv = await prisma.cvAnalysis.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  const hasProfile = skills.length > 0 || Boolean(latestCv);

  if (!hasProfile) {
    return res.json({ hasProfile: false });
  }

  // Same profession-detection precedence used by transition.ts: prefer the CV's own text/headline,
  // fall back to the latest assessment's free-text experience answer, else the general profile.
  let profile: ProfessionProfile;
  if (latestCv) {
    const parsed = parseCvSections(latestCv.rawText);
    profile = detectProfession(latestCv.rawText, parsed.headline);
  } else {
    const latestAssessment = await prisma.assessment.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    const answers = latestAssessment ? JSON.parse(latestAssessment.answers) : null;
    profile = answers?.experienceText ? detectProfession(answers.experienceText) : GENERAL_PROFILE;
  }

  const targetSkills = dedupeCaseInsensitive([...profile.atsKeywords, ...profile.century21Skills]);
  const ownedLower = new Set(skills.map((s) => s.name.toLowerCase()));
  const owned = targetSkills.filter((name) => ownedLower.has(name.toLowerCase()));
  const allGaps = targetSkills.filter((name) => !ownedLower.has(name.toLowerCase()));
  const gapsToEnrich = allGaps.slice(0, MAX_ENRICHED_GAPS);

  const gaps = await Promise.all(
    gapsToEnrich.map(async (skill) => ({
      skill,
      resource: (await searchCoursesByTopic(skill))[0] ?? null,
    }))
  );

  res.json({
    hasProfile: true,
    professionId: profile.id,
    professionLabel: profile.label,
    owned,
    gaps,
    totalGapsCount: allGaps.length,
  });
});
