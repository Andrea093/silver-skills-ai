import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { SECTOR_GROWTH } from "../data/sectorGrowth";
import { searchJobs, buildPortalSearchLinks, Modality } from "../services/jobAggregator";
import { parseCvSections } from "../services/cvParser";
import { detectProfession, detectSpecialty } from "../data/professionProfiles";
import { classifyGoalIntent, extractGoalTarget } from "../data/goalIntent";

export const transitionRouter = Router();

transitionRouter.get("/", requireAuth, async (req, res) => {
  const latest = await prisma.assessment.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });

  const skills = await prisma.skill.findMany({ where: { userId: req.userId! } });
  const latestCv = await prisma.cvAnalysis.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  const cvSkills: string[] = latestCv ? JSON.parse(latestCv.extractedSkills) : [];

  const topSkill = skills.sort((a, b) => b.level - a.level)[0]?.name || cvSkills[0];
  const hasProfile = Boolean(topSkill);
  const country = (req.query.country as string) || "mx";
  const location = (req.query.location as string) || undefined;
  const modality = (req.query.modality as Modality) || "any";

  const goal: string = latest ? (JSON.parse(latest.answers).goal as string) || "" : "";
  const wantsChange = classifyGoalIntent(goal) === "change";
  const goalTarget = wantsChange ? extractGoalTarget(goal) : null;

  // A skill name ("Comunicación") is a poor job-search query — prefer, in order: (1) the person's
  // stated goal when it signals wanting a different career entirely — their words override
  // whatever their CV says they've always done; (2) the CV's own headline; (3) the detected
  // profession combined with any detected subject-matter specialty (e.g. "Docente de Física"), a
  // more specific fallback than the profession label alone for when the headline doesn't capture
  // the specialty; (4) topSkill as a last resort.
  let jobQuery = topSkill;
  if (wantsChange && goalTarget) {
    jobQuery = goalTarget;
  } else if (latestCv) {
    const parsedCv = parseCvSections(latestCv.rawText);
    const profession = detectProfession(latestCv.rawText, parsedCv.headline);
    const specialty = detectSpecialty(profession, latestCv.rawText, parsedCv.headline);
    const professionWithSpecialty = specialty ? `${profession.label} ${specialty.label}` : profession.label;
    jobQuery = parsedCv.headline || (profession.id !== "general" ? professionWithSpecialty : topSkill) || topSkill;
  }

  const jobs = hasProfile ? await searchJobs(jobQuery!, country, { location, modality }) : [];
  const portalLinks = hasProfile ? buildPortalSearchLinks(jobQuery!, country, location, modality) : [];

  res.json({
    hasProfile,
    automationRisk: hasProfile ? latest?.automationRisk ?? null : null,
    adaptationPotential: hasProfile ? latest?.adaptationPotential ?? null : null,
    sectorGrowth: SECTOR_GROWTH,
    currentLevel: skills.length
      ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
      : null,
    requiredLevel: 80,
    topSkill: topSkill || null, // used for the "mejora esta habilidad" recommendation text
    jobSearchQuery: jobQuery || null, // used for the jobs list — a real job title, not just a skill name
    focusMode: wantsChange && goalTarget ? "goal" : "current",
    goalTarget: wantsChange ? goalTarget : null,
    jobs,
    portalLinks,
  });
});
