import express from "express";
// Express 4 does not forward a rejected promise from an async route handler to the error
// middleware below — it crashes the whole process on Node's default unhandledRejection behavior
// instead, taking down every user's request, not just the one that hit the bug. This patches
// Router methods to catch and forward those rejections automatically; must be required before any
// router is created/used.
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth";
import { dashboardRouter } from "./routes/dashboard";
import { assessmentRouter } from "./routes/assessment";
import { transitionRouter } from "./routes/transition";
import { coursesRouter } from "./routes/courses";
import { jobsRouter } from "./routes/jobs";
import { cvRouter } from "./routes/cv";
import { mentorRouter } from "./routes/mentor";
import { adminRouter } from "./routes/admin";
import { skillsUpdateRouter } from "./routes/skillsUpdate";
import { skillsQuizRouter } from "./routes/skillsQuiz";
import { pensionRouter } from "./routes/pension";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api/transition", transitionRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/cv", cvRouter);
app.use("/api/mentor", mentorRouter);
app.use("/api/admin", adminRouter);
app.use("/api/skills-update", skillsUpdateRouter);
app.use("/api/skills-quiz", skillsQuizRouter);
app.use("/api/pension", pensionRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(env.port, () => {
  console.log(`Silver Skills AI backend listening on http://localhost:${env.port}`);
});
