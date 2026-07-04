import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { SECTOR_GROWTH } from "../data/sectorGrowth";
import { searchJobs, buildPortalSearchLinks } from "../services/jobAggregator";

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

  const jobs = hasProfile ? await searchJobs(topSkill!, country) : [];
  const portalLinks = hasProfile ? buildPortalSearchLinks(topSkill!, country) : [];

  res.json({
    hasProfile,
    automationRisk: hasProfile ? latest?.automationRisk ?? null : null,
    adaptationPotential: hasProfile ? latest?.adaptationPotential ?? null : null,
    sectorGrowth: SECTOR_GROWTH,
    currentLevel: skills.length
      ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
      : null,
    requiredLevel: 80,
    topSkill: topSkill || null,
    jobs,
    portalLinks,
  });
});
