import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { computePensionProjection, Regime } from "../services/pensionEstimate";

export const pensionRouter = Router();

const submitSchema = z.object({
  age: z.number().int().min(18).max(100),
  weeksContributed: z.number().int().min(0).max(3000).optional(),
  yearsWorkedEstimate: z.number().int().min(0).max(80).optional(),
  currentIncome: z.number().min(0),
  regime: z.enum(["rpm", "rais", "unknown"]),
  voluntaryMonthlyAmount: z.number().min(0).optional(),
  isCurrentlyFormal: z.boolean().optional(),
});

pensionRouter.post("/", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const input = parsed.data;

  // Recompute server-side from the submitted inputs — never trust a client-sent projection amount.
  const projection = computePensionProjection(input);

  const saved = await prisma.pensionInput.create({
    data: {
      userId: req.userId!,
      age: input.age,
      weeksContributed: input.weeksContributed,
      yearsWorkedEstimate: input.yearsWorkedEstimate,
      currentIncome: input.currentIncome,
      regime: input.regime,
      voluntaryMonthlyAmount: input.voluntaryMonthlyAmount,
      isCurrentlyFormal: input.isCurrentlyFormal,
      // Every scenario is computed and shown at once now — this just records which one the
      // projection recommended at save time, for reference on a returning visit.
      scenario: projection.recommendedScenario,
    },
  });

  res.json({ id: saved.id, input, projection });
});

pensionRouter.get("/latest", requireAuth, async (req, res) => {
  const latest = await prisma.pensionInput.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return res.status(404).json({ error: "Sin proyecciones aún" });

  const input = {
    age: latest.age,
    weeksContributed: latest.weeksContributed ?? undefined,
    yearsWorkedEstimate: latest.yearsWorkedEstimate ?? undefined,
    currentIncome: latest.currentIncome,
    regime: latest.regime as Regime,
    voluntaryMonthlyAmount: latest.voluntaryMonthlyAmount ?? undefined,
    isCurrentlyFormal: latest.isCurrentlyFormal ?? undefined,
  };
  const projection = computePensionProjection(input);

  res.json({ id: latest.id, input, projection, createdAt: latest.createdAt });
});
