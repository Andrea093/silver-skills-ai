import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { SECTOR_GROWTH } from "../data/sectorGrowth";
import { searchJobs, buildPortalSearchLinks, Modality } from "../services/jobAggregator";
import { parseCvSections } from "../services/cvParser";
import { detectProfession } from "../data/professionProfiles";

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

  // A skill name ("Comunicación") is a poor job-search query — prefer the actual role/title
  // detected from the person's own CV when we have one, so search results are relevant to their
  // real profession instead of generic.
  let jobQuery = topSkill;
  if (latestCv) {
    const parsedCv = parseCvSections(latestCv.rawText);
    const profession = detectProfession(latestCv.rawText, parsedCv.headline);
    jobQuery = parsedCv.headline || (profession.id !== "general" ? profession.label : topSkill) || topSkill;
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
    jobs,
    portalLinks,
  });
});
