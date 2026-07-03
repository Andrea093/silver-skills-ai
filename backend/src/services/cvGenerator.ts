import Anthropic from "@anthropic-ai/sdk";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { env, isMentorAgentEnabled } from "../lib/env";

export interface TargetJob {
  source: string;
  externalId: string;
  title: string;
  company?: string;
  tags?: string[];
  description?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedin?: string;
}

interface ExperienceEntry {
  role: string;
  company: string;
  dates: string;
  bullets: string[];
}

interface StructuredCv {
  headline: string;
  summary: string;
  skills: string[];
  experience: ExperienceEntry[];
  education: string[];
  certifications: string[];
}

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

// Without ANTHROPIC_API_KEY there is no real rewriting model, so the "vacancy" mode can't
// genuinely rephrase content around a job description — but it can still honestly reorder/flag
// the skills that actually match the target vacancy's real tags/description, instead of returning
// an identical document to the ATS mode.
function heuristicStructureCv(rawText: string, mode: "ats" | "vacancy", targetJob?: TargetJob): StructuredCv {
  const lower = rawText.toLowerCase();
  const allSkills = KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let skills = allSkills.length > 0 ? allSkills : ["Liderazgo", "Comunicación", "Adaptabilidad"];
  let headline = "Perfil Profesional";
  let summary =
    lines.slice(0, 3).join(" ") ||
    "Profesional con trayectoria diversa, buscando nuevas oportunidades de desarrollo.";

  if (mode === "vacancy" && targetJob) {
    const jobText = `${targetJob.title} ${(targetJob.tags || []).join(" ")} ${targetJob.description || ""}`.toLowerCase();
    const matching = skills.filter((s) => jobText.includes(s.toLowerCase()));
    const rest = skills.filter((s) => !matching.includes(s));
    skills = [...matching, ...rest];
    headline = `Candidato/a para: ${targetJob.title}`;
    summary = `${summary} Perfil orientado a la vacante de ${targetJob.title}${
      targetJob.company ? ` en ${targetJob.company}` : ""
    }, con especial énfasis en ${matching.length > 0 ? matching.join(", ") : "las habilidades requeridas por la vacante"}.`;
  }

  return {
    headline,
    summary,
    skills,
    experience: [
      {
        role: "Experiencia profesional",
        company: "",
        dates: "",
        bullets: lines.slice(0, 12),
      },
    ],
    education: [],
    certifications: [],
  };
}

async function structureCvWithClaude(
  rawText: string,
  mode: "ats" | "vacancy",
  targetJob?: TargetJob
): Promise<StructuredCv> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  const instructions =
    mode === "vacancy" && targetJob
      ? `Reescribe y reorganiza este CV para maximizar la compatibilidad con esta vacante específica real:
Título: ${targetJob.title}
Empresa: ${targetJob.company || "N/A"}
Etiquetas/skills buscadas: ${(targetJob.tags || []).join(", ")}
Descripción real de la vacante: ${(targetJob.description || "").slice(0, 3000)}

Prioriza y resalta la experiencia y habilidades del candidato que mejor calcen con esta vacante, usando terminología similar a la descripción cuando sea honesto hacerlo (nunca inventes experiencia que no está en el CV original).`
      : `Reescribe y reorganiza este CV para maximizar la compatibilidad con sistemas ATS (Applicant Tracking Systems) en general: usa encabezados estándar, palabras clave de la industria detectada, y logros cuantificables cuando el texto original lo permita. Nunca inventes experiencia que no está en el CV original.`;

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${instructions}

Responde SOLO con JSON válido con este shape exacto:
{
  "headline": string (título profesional corto, ej. "Gerente de Ventas Senior"),
  "summary": string (3-4 líneas),
  "skills": string[] (8-14 habilidades relevantes),
  "experience": [{ "role": string, "company": string, "dates": string, "bullets": string[] (2-5 logros por rol) }],
  "education": string[],
  "certifications": string[]
}

CV original del candidato:
${rawText.slice(0, 8000)}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") throw new Error("No text response");
  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found");
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    headline: parsed.headline || "Perfil Profesional",
    summary: parsed.summary || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
  };
}

function buildDocx(structured: StructuredCv, contact: Contact): Promise<Buffer> {
  const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin]
    .filter(Boolean)
    .join(" · ");

  const children: Paragraph[] = [
    new Paragraph({
      children: [new TextRun({ text: contact.name, bold: true, size: 32 })],
    }),
    new Paragraph({
      children: [new TextRun({ text: structured.headline, size: 24, color: "2563eb" })],
    }),
    new Paragraph({ children: [new TextRun({ text: contactLine, size: 20, color: "555555" })] }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Resumen Profesional", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ children: [new TextRun(structured.summary)] }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Habilidades Clave", heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ children: [new TextRun(structured.skills.join(" · "))] }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Experiencia Profesional", heading: HeadingLevel.HEADING_2 }),
  ];

  for (const exp of structured.experience) {
    const roleLine = [exp.role, exp.company].filter(Boolean).join(" — ");
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: roleLine, bold: true }),
          ...(exp.dates ? [new TextRun({ text: `  (${exp.dates})`, color: "555555" })] : []),
        ],
      })
    );
    for (const bullet of exp.bullets) {
      children.push(new Paragraph({ children: [new TextRun(`• ${bullet}`)] }));
    }
    children.push(new Paragraph({ text: "" }));
  }

  if (structured.education.length > 0) {
    children.push(new Paragraph({ text: "Educación", heading: HeadingLevel.HEADING_2 }));
    for (const edu of structured.education) {
      children.push(new Paragraph({ children: [new TextRun(edu)] }));
    }
    children.push(new Paragraph({ text: "" }));
  }

  if (structured.certifications.length > 0) {
    children.push(new Paragraph({ text: "Certificaciones", heading: HeadingLevel.HEADING_2 }));
    for (const cert of structured.certifications) {
      children.push(new Paragraph({ children: [new TextRun(cert)] }));
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}

export async function generateTailoredCv(params: {
  rawText: string;
  mode: "ats" | "vacancy";
  targetJob?: TargetJob;
  contact: Contact;
}): Promise<Buffer> {
  let structured: StructuredCv;
  if (isMentorAgentEnabled()) {
    try {
      structured = await structureCvWithClaude(params.rawText, params.mode, params.targetJob);
    } catch {
      structured = heuristicStructureCv(params.rawText, params.mode, params.targetJob);
    }
  } else {
    structured = heuristicStructureCv(params.rawText, params.mode, params.targetJob);
  }

  return buildDocx(structured, params.contact);
}
