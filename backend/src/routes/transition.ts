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
  const topSkill = skills.sort((a, b) => b.level - a.level)[0]?.name || "consultoría digital";
  const country = (req.query.country as string) || "mx";

  const jobs = await searchJobs(topSkill, country);
  const portalLinks = buildPortalSearchLinks(topSkill, country);

  res.json({
    automationRisk: latest?.automationRisk ?? 50,
    adaptationPotential: latest?.adaptationPotential ?? 50,
    sectorGrowth: SECTOR_GROWTH,
    currentLevel: skills.length
      ? Math.round(skills.reduce((sum, s) => sum + s.level, 0) / skills.length)
      : 50,
    requiredLevel: 80,
    topSkill,
    jobs,
    portalLinks,
  });
});
