import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { searchJobs } from "../services/jobAggregator";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const skills = await prisma.skill.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  const topSkillName = skills[0]?.name || "consultoría";

  let opportunitiesCount = 0;
  try {
    const jobs = await searchJobs(topSkillName, "mx");
    opportunitiesCount = jobs.length; // real count of currently matching live job listings
  } catch {
    opportunitiesCount = 0;
  }

  res.json({
    name: user.name,
    employabilityScore: user.employabilityScore,
    skills: skills.map((s) => ({ name: s.name, level: s.level })),
    activeSkillsCount: skills.length,
    opportunitiesCount,
  });
});
