import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { runMentorAgent } from "../services/mentorAgent";
import { isMentorAgentEnabled } from "../lib/env";

export const mentorRouter = Router();

mentorRouter.get("/status", requireAuth, (_req, res) => {
  res.json({ agentEnabled: isMentorAgentEnabled() });
});

mentorRouter.get("/history", requireAuth, async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "asc" },
  });
  res.json(messages.map((m) => ({ ...m, cards: m.cards ? JSON.parse(m.cards) : [] })));
});

const chatSchema = z.object({ message: z.string().min(1) });

mentorRouter.post("/chat", requireAuth, async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Mensaje inválido" });

  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  const skills = await prisma.skill.findMany({ where: { userId: user.id } });

  const historyRows = await prisma.chatMessage.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  const history = historyRows.map((h) => ({ role: h.role as "user" | "assistant", content: h.content }));

  await prisma.chatMessage.create({ data: { userId: user.id, role: "user", content: parsed.data.message } });

  const reply = await runMentorAgent(parsed.data.message, history, {
    name: user.name,
    employabilityScore: user.employabilityScore,
    skills: skills.map((s) => ({ name: s.name, level: s.level })),
    country: "mx",
  });

  const saved = await prisma.chatMessage.create({
    data: {
      userId: user.id,
      role: "assistant",
      content: reply.message,
      cards: JSON.stringify(reply.cards),
    },
  });

  res.json({ id: saved.id, message: reply.message, cards: reply.cards, createdAt: saved.createdAt });
});
