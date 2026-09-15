import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { listCourses, listLearningPaths } from "../services/courseCatalog";
import { DEMAND_DATASET } from "../services/assessmentScoring";
import { classifyGoalIntent, extractGoalTarget } from "../data/goalIntent";

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

// Same classification transition.ts already uses to pivot the job search around a stated
// career-change goal instead of always assuming the person wants to keep doing what their CV says —
// applied here too, so "quiero cambiar a X" also prioritizes university programs toward X, not just
// short courses for the person's current skill gaps.
async function getGoalContext(userId: string): Promise<{ intent: "change" | "stay"; target: string | null }> {
  const latest = await prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  const goal: string = latest ? (JSON.parse(latest.answers).goal as string) || "" : "";
  const intent = classifyGoalIntent(goal);
  return { intent, target: intent === "change" ? extractGoalTarget(goal) : null };
}

coursesRouter.get("/", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const recommendedSkillNames = await getRecommendedSkillNames(req.userId!);
  const goalContext = await getGoalContext(req.userId!);
  const courses = await listCourses({ category, search, recommendedSkillNames, goalContext });
  res.json(courses);
});

coursesRouter.get("/paths", requireAuth, async (req, res) => {
  const recommendedSkillNames = await getRecommendedSkillNames(req.userId!);
  const paths = await listLearningPaths(recommendedSkillNames);
  res.json(paths);
});
