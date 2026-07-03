import Anthropic from "@anthropic-ai/sdk";
import { env, isMentorAgentEnabled } from "../lib/env";

const KNOWN_SKILLS = [
  "Liderazgo",
  "Excel",
  "Comunicación",
  "Gestión",
  "Marketing Digital",
  "Análisis de Datos",
  "Ventas",
  "Atención al Cliente",
  "Negociación",
  "Gestión de Proyectos",
  "Inglés",
  "IA Generativa",
  "Redes Sociales",
  "Contabilidad",
  "Finanzas",
];

export interface CvAnalysisResult {
  extractedSkills: string[];
  atsScore: number;
  suggestions: string[];
}

function heuristicAnalyze(text: string): CvAnalysisResult {
  const lower = text.toLowerCase();
  const extractedSkills = KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase()));

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasNumbers = /\d/.test(text);
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(text);

  let atsScore = 40;
  if (extractedSkills.length >= 3) atsScore += 20;
  if (hasNumbers) atsScore += 15; // quantified achievements
  if (hasEmail) atsScore += 10;
  if (wordCount > 150) atsScore += 15;
  atsScore = Math.max(10, Math.min(95, atsScore));

  const suggestions: string[] = [];
  if (!hasNumbers) suggestions.push("Agrega logros cuantificables (ej. 'aumenté ventas en 20%').");
  if (extractedSkills.length < 3) suggestions.push("Incluye más palabras clave de habilidades relevantes para tu industria.");
  if (!hasEmail) suggestions.push("Asegúrate de incluir tu información de contacto (email, teléfono).");
  if (wordCount < 150) suggestions.push("Tu CV parece muy corto — detalla más tu experiencia y logros.");
  if (suggestions.length === 0) suggestions.push("Tu CV luce sólido. Considera adaptarlo a cada vacante con las palabras clave del anuncio.");

  return { extractedSkills, atsScore, suggestions };
}

export async function analyzeCv(text: string): Promise<CvAnalysisResult> {
  if (!isMentorAgentEnabled()) {
    return heuristicAnalyze(text);
  }

  try {
    const client = new Anthropic({ apiKey: env.anthropicApiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analiza este CV para un adulto 50+ que busca reinsertarse laboralmente en LATAM. Responde SOLO con JSON válido con este shape exacto: {"extractedSkills": string[], "atsScore": number (0-100), "suggestions": string[] (3-5 sugerencias concretas para optimizar el CV para sistemas ATS)}.\n\nCV:\n${text.slice(0, 8000)}`,
        },
      ],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") throw new Error("No text response");
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      extractedSkills: Array.isArray(parsed.extractedSkills) ? parsed.extractedSkills : [],
      atsScore: typeof parsed.atsScore === "number" ? parsed.atsScore : 50,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch {
    return heuristicAnalyze(text);
  }
}
