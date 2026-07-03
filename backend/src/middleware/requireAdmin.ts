import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Requiere permisos de administrador" });
  }
  next();
}
