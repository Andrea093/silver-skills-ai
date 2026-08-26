import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { computeFinancialRecommendation, Debt } from "../services/financialWellnessScoring";

export const financialWellnessRouter = Router();

const debtSchema = z.object({
  name: z.string().min(1),
  amount: z.number().min(0),
  interestRatePct: z.number().min(0).max(200),
});

const submitSchema = z.object({
  monthlyIncome: z.number().min(0),
  monthlyExpenses: z.number().min(0).optional(),
  debts: z.array(debtSchema).optional(),
  emergencyFund: z.number().min(0).optional(),
});

financialWellnessRouter.post("/", requireAuth, async (req, res) => {
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const input = parsed.data;

  // Recompute server-side from the submitted inputs — never trust a client-sent recommendation.
  const recommendation = computeFinancialRecommendation(input);

  const saved = await prisma.financialWellnessInput.create({
    data: {
      userId: req.userId!,
      monthlyIncome: input.monthlyIncome,
      monthlyExpenses: input.monthlyExpenses,
      debts: input.debts ? JSON.stringify(input.debts) : undefined,
      emergencyFund: input.emergencyFund,
    },
  });

  res.json({ id: saved.id, input, recommendation });
});

financialWellnessRouter.get("/latest", requireAuth, async (req, res) => {
  const latest = await prisma.financialWellnessInput.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return res.status(404).json({ error: "Sin datos financieros aún" });

  const input = {
    monthlyIncome: latest.monthlyIncome,
    monthlyExpenses: latest.monthlyExpenses ?? undefined,
    debts: latest.debts ? (JSON.parse(latest.debts) as Debt[]) : undefined,
    emergencyFund: latest.emergencyFund ?? undefined,
  };
  // Recomputed fresh (not stored frozen) so an improvement to the recommendation logic applies
  // retroactively to existing data, same principle as recommendedSkills in assessment.ts.
  const recommendation = computeFinancialRecommendation(input);

  res.json({ id: latest.id, input, recommendation, createdAt: latest.createdAt });
});
