import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signToken, AUTH_COOKIE_NAME } from "../utils/authTokens";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  employabilityScore: number;
  role: string;
  isPremium: boolean;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    employabilityScore: user.employabilityScore,
    role: user.role,
    isPremium: user.isPremium,
  };
}

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  // Frontend and backend live on different onrender.com subdomains in production, so the cookie
  // must be SameSite=None (requires Secure) to be sent on cross-origin fetch requests. Locally,
  // Vite's dev proxy makes everything same-origin, so Lax + non-secure works over plain http.
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  secure: isProd,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese correo" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const token = signToken({ userId: user.id });
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  res.json(serializeUser(user));
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciales inválidas" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Credenciales inválidas" });

  const token = signToken({ userId: user.id });
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions);
  res.json(serializeUser(user));
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json(serializeUser(user));
});
