import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { listCourses, listLearningPaths } from "../services/courseCatalog";
import { DEMAND_DATASET } from "../services/assessmentScoring";

export const coursesRouter = Router();

async function getRecommendedSkillNames(userId: string): Promise<string[]> {
  const skills = await prisma.skill.findMany({ where: { userId } });
  if (skills.length === 0) return [];

  const weakOwned = skills.filter((s) => s.level < 70).map((s) => s.name);
  const missingInDemand = DEMAND_DATASET.filter((d) => {
    const owned = skills.find((s) => s.name === d.name);
    return !owned || owned.level < 70;
  }).map((d) => d.name);

  return Array.from(new Set([...weakOwned, ...missingInDemand]));
}

coursesRouter.get("/", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const recommendedSkillNames = await getRecommendedSkillNames(req.userId!);
  const courses = await listCourses({ category, search, recommendedSkillNames });
  res.json(courses);
});

coursesRouter.get("/paths", requireAuth, async (_req, res) => {
  const paths = await listLearningPaths();
  res.json(paths);
});
