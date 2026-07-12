import Anthropic from "@anthropic-ai/sdk";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import PDFDocument from "pdfkit";
import { env, isMentorAgentEnabled } from "../lib/env";
import { parseCvSections } from "./cvParser";
import { detectProfession, ProfessionProfile } from "../data/professionProfiles";

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

export interface PlatformSkill {
  name: string;
  level: number;
}

export type CvFormat = "docx" | "pdf";

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
  century21Skills: string[];
  experienceSectionLabel: string;
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

export function dedupeCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

function mergePlatformSkills(skills: string[], summary: string, platformSkills: PlatformSkill[]): { skills: string[]; summary: string } {
  if (platformSkills.length === 0) return { skills, summary };

  const existingLower = skills.map((s) => s.toLowerCase());
  const newSkills = platformSkills
    .filter((s) => s.level >= 50) // only confident-enough skills, not ones barely started
    .filter((s) => !existingLower.includes(s.name.toLowerCase()))
    .map((s) => s.name);

  if (newSkills.length === 0) return { skills, summary };

  return {
    skills: dedupeCaseInsensitive([...skills, ...newSkills]),
    summary: `${summary} Habilidades adicionales desarrolladas recientemente en la plataforma: ${newSkills.join(", ")}.`,
  };
}

// Without ANTHROPIC_API_KEY there is no real rewriting model, so this builds the CV from the
// actual parsed structure of the uploaded document plus a profession-specific ATS keyword bank —
// real differentiation by profile instead of one generic "dump the text as bullets" template.
function heuristicStructureCv(
  rawText: string,
  mode: "ats" | "vacancy",
  targetJob: TargetJob | undefined,
  profile: ProfessionProfile
): StructuredCv {
  const parsed = parseCvSections(rawText);
  const lower = rawText.toLowerCase();

  const atsMatches = profile.atsKeywords.filter((k) => lower.includes(k.toLowerCase()));
  const genericMatches = KNOWN_SKILLS.filter((s) => lower.includes(s.toLowerCase()));
  const skillsFromLine = parsed.skillsLine
    ? parsed.skillsLine.split(/,\s*/).map((s) => s.trim()).filter(Boolean)
    : [];

  let skills = dedupeCaseInsensitive([...skillsFromLine, ...atsMatches, ...genericMatches]);
  if (skills.length === 0) skills = profile.atsKeywords.slice(0, 6);

  let headline = parsed.headline || profile.label;
  let summary =
    parsed.profileSummary ||
    `Profesional del área de ${profile.label.toLowerCase()} con experiencia relevante y trayectoria demostrable.`;

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

  const experience: ExperienceEntry[] =
    parsed.experience.length > 0
      ? parsed.experience.map((e) => ({ role: e.role, company: e.company, dates: e.dates, bullets: e.bullets }))
      : [
          {
            role: profile.experienceSectionLabel,
            company: "",
            dates: "",
            bullets: rawText
              .split(/\r?\n/)
              .map((l) => l.trim())
              .filter(Boolean)
              .slice(0, 12),
          },
        ];

  return {
    headline,
    summary,
    skills,
    century21Skills: profile.century21Skills,
    experienceSectionLabel: profile.experienceSectionLabel,
    experience,
    education: parsed.education,
    certifications: parsed.courses,
  };
}

async function structureCvWithClaude(
  rawText: string,
  mode: "ats" | "vacancy",
  targetJob: TargetJob | undefined,
  platformSkills: PlatformSkill[],
  profile: ProfessionProfile
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

  const platformSkillsNote =
    platformSkills.length > 0
      ? `\n\nEl candidato completó una evaluación de habilidades en la plataforma con estos resultados (inclúyelas en "skills" si tienen sentido junto con el resto del perfil, especialmente las que no aparezcan ya en el CV original): ${platformSkills
          .map((s) => `${s.name} (${s.level}%)`)
          .join(", ")}.`
      : "";

  const professionNote = `\n\nDetectamos que este candidato pertenece al área de "${profile.label}". Usa palabras clave ATS relevantes a esta área, por ejemplo: ${profile.atsKeywords.join(", ")}.`;

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `${instructions}${platformSkillsNote}${professionNote}

Responde SOLO con JSON válido con este shape exacto:
{
  "headline": string (título profesional corto, específico del área detectada),
  "summary": string (3-4 líneas),
  "skills": string[] (8-14 habilidades relevantes al área),
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
    headline: parsed.headline || profile.label,
    summary: parsed.summary || "",
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    century21Skills: profile.century21Skills,
    experienceSectionLabel: profile.experienceSectionLabel,
    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
    education: Array.isArray(parsed.education) ? parsed.education : [],
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
  };
}

const NAVY = "16283F";
const ACCENT = "A8741F";

function buildDocx(structured: StructuredCv, contact: Contact): Promise<Buffer> {
  const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin]
    .filter(Boolean)
    .join("   ·   ");

  function sectionHeading(text: string) {
    return new Paragraph({
      spacing: { before: 200, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 2 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: NAVY, characterSpacing: 10 })],
    });
  }

  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: contact.name, bold: true, size: 34, color: NAVY })] }),
    new Paragraph({ children: [new TextRun({ text: structured.headline, size: 24, color: ACCENT, bold: true })] }),
    new Paragraph({ children: [new TextRun({ text: contactLine, size: 19, color: "555555" })] }),

    sectionHeading("Resumen Profesional"),
    new Paragraph({ children: [new TextRun(structured.summary)] }),

    sectionHeading("Habilidades Clave"),
    new Paragraph({ children: [new TextRun(structured.skills.join("  ·  "))] }),
  ];

  if (structured.century21Skills.length > 0) {
    children.push(
      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Competencias del Siglo XXI", bold: true, size: 19 })] }),
      new Paragraph({ children: [new TextRun(structured.century21Skills.join("  ·  "))] })
    );
  }

  children.push(sectionHeading(structured.experienceSectionLabel));
  for (const exp of structured.experience) {
    const roleLine = [exp.role, exp.company].filter(Boolean).join(" — ");
    children.push(
      new Paragraph({
        spacing: { before: 100 },
        children: [
          new TextRun({ text: roleLine, bold: true }),
          ...(exp.dates ? [new TextRun({ text: `  (${exp.dates})`, color: "555555" })] : []),
        ],
      })
    );
    for (const bullet of exp.bullets) {
      children.push(new Paragraph({ children: [new TextRun(`•  ${bullet}`)] }));
    }
  }

  if (structured.education.length > 0) {
    children.push(sectionHeading("Educación"));
    for (const edu of structured.education) {
      children.push(new Paragraph({ children: [new TextRun(edu)] }));
    }
  }

  if (structured.certifications.length > 0) {
    children.push(sectionHeading("Cursos y Certificaciones"));
    for (const cert of structured.certifications) {
      children.push(new Paragraph({ children: [new TextRun(cert)] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

// Plain, single-column layout on purpose — the same ATS best practice as the Word version
// (no tables/columns/text boxes that ATS parsers can garble), just rendered as a PDF for markets
// or applicant systems that specifically ask for one.
function buildPdf(structured: StructuredCv, contact: Contact): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const contactLine = [contact.email, contact.phone, contact.location, contact.linkedin]
      .filter(Boolean)
      .join("  ·  ");

    doc.font("Helvetica-Bold").fontSize(21).fillColor("#16283F").text(contact.name);
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#A8741F").text(structured.headline);
    doc.font("Helvetica").fontSize(10).fillColor("#555555").text(contactLine);
    doc.moveDown();

    function heading(text: string) {
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#16283F").text(text.toUpperCase(), { characterSpacing: 0.6 });
      doc
        .moveTo(doc.x, doc.y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
        .strokeColor("#A8741F")
        .lineWidth(1.5)
        .stroke();
      doc.moveDown(0.4);
    }
    function body(text: string) {
      doc.font("Helvetica").fontSize(10.5).fillColor("#222222").text(text);
    }

    heading("Resumen Profesional");
    body(structured.summary);
    doc.moveDown();

    heading("Habilidades Clave");
    body(structured.skills.join("  ·  "));
    doc.moveDown();

    if (structured.century21Skills.length > 0) {
      doc.font("Helvetica-Bold").fontSize(10.5).fillColor("#16283F").text("Competencias del Siglo XXI");
      body(structured.century21Skills.join("  ·  "));
      doc.moveDown();
    }

    heading(structured.experienceSectionLabel);
    for (const exp of structured.experience) {
      const roleLine = [exp.role, exp.company].filter(Boolean).join(" — ");
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111111").text(roleLine + (exp.dates ? `  (${exp.dates})` : ""));
      for (const bullet of exp.bullets) {
        doc.font("Helvetica").fontSize(10.5).fillColor("#222222").text(`•  ${bullet}`);
      }
      doc.moveDown(0.5);
    }

    if (structured.education.length > 0) {
      heading("Educación");
      structured.education.forEach((edu) => body(edu));
      doc.moveDown();
    }

    if (structured.certifications.length > 0) {
      heading("Cursos y Certificaciones");
      structured.certifications.forEach((cert) => body(cert));
    }

    doc.end();
  });
}

export interface GeneratedCv {
  buffer: Buffer;
  professionLabel: string;
}

export async function generateTailoredCv(params: {
  rawText: string;
  mode: "ats" | "vacancy";
  targetJob?: TargetJob;
  contact: Contact;
  platformSkills?: PlatformSkill[];
  format?: CvFormat;
}): Promise<GeneratedCv> {
  const platformSkills = params.platformSkills || [];
  const profile = detectProfession(params.rawText);

  let structured: StructuredCv;
  if (isMentorAgentEnabled()) {
    try {
      structured = await structureCvWithClaude(params.rawText, params.mode, params.targetJob, platformSkills, profile);
    } catch {
      structured = heuristicStructureCv(params.rawText, params.mode, params.targetJob, profile);
      const merged = mergePlatformSkills(structured.skills, structured.summary, platformSkills);
      structured = { ...structured, skills: merged.skills, summary: merged.summary };
    }
  } else {
    structured = heuristicStructureCv(params.rawText, params.mode, params.targetJob, profile);
    const merged = mergePlatformSkills(structured.skills, structured.summary, platformSkills);
    structured = { ...structured, skills: merged.skills, summary: merged.summary };
  }

  const buffer =
    params.format === "pdf" ? await buildPdf(structured, params.contact) : await buildDocx(structured, params.contact);

  return { buffer, professionLabel: profile.label };
}
