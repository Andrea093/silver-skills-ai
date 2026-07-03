import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { listCourses, listLearningPaths } from "../services/courseCatalog";

export const coursesRouter = Router();

coursesRouter.get("/", requireAuth, async (req, res) => {
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const courses = await listCourses({ category, search });
  res.json(courses);
});

coursesRouter.get("/paths", requireAuth, async (_req, res) => {
  const paths = await listLearningPaths();
  res.json(paths);
});
