import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { searchJobs, buildPortalSearchLinks } from "../services/jobAggregator";

export const jobsRouter = Router();

jobsRouter.get("/search", requireAuth, async (req, res) => {
  const query = String(req.query.q || "");
  const country = String(req.query.country || "mx");
  const jobs = await searchJobs(query, country);
  const portalLinks = buildPortalSearchLinks(query, country);
  res.json({ jobs, portalLinks });
});

const saveSchema = z.object({
  source: z.string(),
  externalId: z.string(),
  title: z.string(),
  company: z.string().optional(),
  url: z.string().url(),
  compatibility: z.number().optional(),
  salaryRange: z.string().optional(),
  countries: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

jobsRouter.post("/save", requireAuth, async (req, res) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const d = parsed.data;

  const saved = await prisma.savedJob.upsert({
    where: { userId_source_externalId: { userId: req.userId!, source: d.source, externalId: d.externalId } },
    update: {},
    create: {
      userId: req.userId!,
      source: d.source,
      externalId: d.externalId,
      title: d.title,
      company: d.company,
      url: d.url,
      compatibility: d.compatibility,
      salaryRange: d.salaryRange,
      countries: d.countries,
      tags: d.tags ? JSON.stringify(d.tags) : null,
    },
  });
  res.json(saved);
});

jobsRouter.get("/saved", requireAuth, async (req, res) => {
  const saved = await prisma.savedJob.findMany({ where: { userId: req.userId! }, orderBy: { createdAt: "desc" } });
  res.json(saved.map((s) => ({ ...s, tags: s.tags ? JSON.parse(s.tags) : [] })));
});
