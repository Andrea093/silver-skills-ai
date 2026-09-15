import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { listCourses, listLearningPaths } from "../services/courseCatalog";
import { computeRecommendedSkills } from "../services/assessmentScoring";
import { classifyGoalIntent, extractGoalTarget } from "../data/goalIntent";
import { detectProfession } from "../data/professionProfiles";

export const coursesRouter = Router();

interface UserContext {
  professionId?: string;
  goalIntent: "change" | "stay";
  goalTarget: string | null;
}

// One shared read of the latest assessment for everything this route needs to personalize by —
// which profession's in-demand skills to recommend (see DEMAND_BY_PROFESSION in
// assessmentScoring.ts: a biologist and a lawyer shouldn't both get "Inteligencia Artificial" and
// "Gestión Remota" as their only recommendations) and whether the stated goal is a career change.
async function getUserContext(userId: string): Promise<UserContext> {
  const latest = await prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  if (!latest) return { goalIntent: "stay", goalTarget: null };
  const answers = JSON.parse(latest.answers || "{}");
  const goal: string = answers.goal || "";
  const professionId: string | undefined = answers.professionId || (answers.experienceText ? detectProfession(answers.experienceText).id : undefined);
  const goalIntent = classifyGoalIntent(goal);
  return { professionId, goalIntent, goalTarget: goalIntent === "change" ? extractGoalTarget(goal) : null };
}

async function getRecommendedSkillNames(userId: string, professionId?: string): Promise<string[]> {
  const skills = await prisma.skill.findMany({ where: { userId } });
  if (skills.length === 0) return [];

  const weakOwned = skills.filter((s) => s.level < 70).map((s) => s.name);
  const missingInDemand = computeRecommendedSkills(skills, professionId).map((d) => d.name);

  return Array.from(new Set([...weakOwned, ...missingInDemand]));
}

coursesRouter.get("/", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const context = await getUserContext(req.userId!);
  const recommendedSkillNames = await getRecommendedSkillNames(req.userId!, context.professionId);
  const courses = await listCourses({
    category,
    search,
    recommendedSkillNames,
    goalContext: { intent: context.goalIntent, target: context.goalTarget },
  });
  res.json(courses);
});

coursesRouter.get("/paths", requireAuth, async (req, res) => {
  const context = await getUserContext(req.userId!);
  const recommendedSkillNames = await getRecommendedSkillNames(req.userId!, context.professionId);
  const paths = await listLearningPaths(recommendedSkillNames);
  res.json(paths);
});
