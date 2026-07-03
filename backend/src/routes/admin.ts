import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { requireAdmin } from "../middleware/requireAdmin";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/users", async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isPremium: true,
      employabilityScore: true,
      createdAt: true,
    },
  });
  res.json(users);
});

function generateTempPassword(): string {
  return crypto.randomBytes(6).toString("base64url"); // ~8 url-safe chars
}

adminRouter.post("/users/:id/reset-password", async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash } });

  res.json({ email: target.email, tempPassword });
});

adminRouter.post("/users/:id/toggle-premium", async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { isPremium: !target.isPremium },
  });
  res.json({ id: updated.id, isPremium: updated.isPremium });
});

adminRouter.delete("/users/:id", async (req, res) => {
  if (req.params.id === req.userId) {
    return res.status(400).json({ error: "No puedes eliminar tu propia cuenta de administrador" });
  }
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuario no encontrado" });

  await prisma.user.delete({ where: { id: target.id } });
  res.json({ ok: true });
});
