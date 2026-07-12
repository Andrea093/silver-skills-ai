import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { analyzeCv } from "../services/cvAnalyzer";
import { generateTailoredCv } from "../services/cvGenerator";

export const cvRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function extractText(file: Express.Multer.File): Promise<string> {
  const ext = file.originalname.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  if (ext === "docx" || ext === "doc") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  return file.buffer.toString("utf-8");
}

cvRouter.post("/analyze", requireAuth, upload.single("cv"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No se envió ningún archivo" });

  const allowed = ["pdf", "doc", "docx"];
  const ext = req.file.originalname.split(".").pop()?.toLowerCase();
  if (!ext || !allowed.includes(ext)) {
    return res.status(400).json({ error: "Formato no soportado. Usa PDF, DOC o DOCX." });
  }

  try {
    const text = await extractText(req.file);
    if (!text.trim()) {
      return res.status(400).json({ error: "No se pudo extraer texto del archivo" });
    }
    const result = await analyzeCv(text);

    const saved = await prisma.cvAnalysis.create({
      data: {
        userId: req.userId!,
        filename: req.file.originalname,
        rawText: text,
        extractedSkills: JSON.stringify(result.extractedSkills),
        atsScore: result.atsScore,
        suggestions: JSON.stringify(result.suggestions),
      },
    });

    res.json({
      id: saved.id,
      filename: saved.filename,
      extractedSkills: result.extractedSkills,
      atsScore: result.atsScore,
      suggestions: result.suggestions,
      professionLabel: result.professionLabel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al procesar el CV" });
  }
});

const generateSchema = z.object({
  analysisId: z.string(),
  mode: z.enum(["ats", "vacancy"]),
  format: z.enum(["docx", "pdf"]).default("docx"),
  jobId: z
    .object({
      source: z.string(),
      externalId: z.string(),
      title: z.string(),
      company: z.string().optional(),
      tags: z.array(z.string()).optional(),
      description: z.string().optional(),
    })
    .optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      location: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
});

cvRouter.post("/generate", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! } });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  if (!user.isPremium) {
    return res.status(403).json({ error: "Esta función requiere una cuenta premium" });
  }

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  const { analysisId, mode, format, jobId: targetJob, contact } = parsed.data;

  const analysis = await prisma.cvAnalysis.findFirst({ where: { id: analysisId, userId: user.id } });
  if (!analysis) return res.status(404).json({ error: "Análisis de CV no encontrado" });

  if (mode === "vacancy" && !targetJob) {
    return res.status(400).json({ error: "Selecciona una vacante para adaptar el CV" });
  }

  try {
    const platformSkills = await prisma.skill.findMany({
      where: { userId: user.id },
      select: { name: true, level: true },
    });

    const { buffer, professionLabel } = await generateTailoredCv({
      rawText: analysis.rawText,
      mode,
      format,
      targetJob,
      contact: { name: user.name, email: user.email, ...contact },
      platformSkills,
    });

    const safeName = user.name.replace(/[^a-zA-Z0-9]+/g, "_");
    const suffix = mode === "vacancy" ? `_${(targetJob!.title || "vacante").replace(/[^a-zA-Z0-9]+/g, "_")}` : "_ATS";
    const contentTypes = {
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pdf: "application/pdf",
    };
    res.setHeader("Content-Disposition", `attachment; filename="CV_${safeName}${suffix}.${format}"`);
    res.setHeader("Content-Type", contentTypes[format]);
    res.setHeader("X-Profession-Label", encodeURIComponent(professionLabel));
    res.setHeader("Access-Control-Expose-Headers", "X-Profession-Label, Content-Disposition");
    res.send(buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al generar el CV optimizado" });
  }
});
