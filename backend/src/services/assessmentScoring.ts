// Deterministic heuristic scoring for the assessment wizard.
// This is intentionally rule-based (not a trained ML model) so results are explainable and
// reproducible without external dependencies. When ANTHROPIC_API_KEY is configured, the free-text
// "experiencia previa" answer is additionally sent to Claude to enrich the textual summary.

import { detectProfession } from "../data/professionProfiles";

const GENERIC_SKILL_POOL = ["Liderazgo", "Comunicación", "Gestión", "Excel", "Análisis de Datos", "Inglés"];

export interface AssessmentAnswers {
  experienceText: string;
  currentSkills: { name: string; level: number }[];
  interests: string[];
  goal: string;
  weeklyHours: number;
}

export interface SkillResult {
  name: string;
  level: number;
}

export interface RecommendedSkill {
  name: string;
  demand: string;
  growthPct: number;
}

const SOFT_SKILLS = ["Liderazgo", "Comunicación", "Gestión"];
const DIGITAL_SKILLS = ["Excel", "IA Generativa", "Análisis de Datos", "Marketing Digital"];

const AUTOMATION_PRONE_KEYWORDS = [
  "manufactura",
  "producción en línea",
  "captura de datos",
  "digitación",
  "cajero",
  "ensamblaje",
  "operativo repetitivo",
];

export const DEMAND_DATASET: RecommendedSkill[] = [
  { name: "Inteligencia Artificial", demand: "Demanda Alta", growthPct: 145 },
  { name: "Marketing Digital", demand: "Demanda Alta", growthPct: 98 },
  { name: "Análisis de Datos", demand: "Demanda Media-Alta", growthPct: 112 },
  { name: "Gestión Remota", demand: "Demanda Alta", growthPct: 87 },
];

export const WIZARD_STEPS = [
  {
    id: "experience",
    title: "Experiencia Previa",
    description: "Cuéntanos sobre tu trayectoria profesional",
    type: "textarea",
    placeholder: "Ejemplo: He trabajado 20 años en gestión de ventas y liderazgo de equipos en el sector retail...",
  },
  {
    id: "cv-upload",
    title: "Sube tu Currículum (opcional)",
    description: "Si lo subes aquí, detectamos habilidades reales de tu CV para la siguiente pregunta — y ya queda listo para generar una versión optimizada más adelante",
    type: "cv-upload",
  },
  {
    id: "skills",
    title: "Habilidades Detectadas",
    description: "Ajusta el nivel de cada una según tu experiencia real (0-100)",
    type: "skill-sliders",
    // Default/fallback options when the person skips the CV step and detect-skills hasn't run yet
    // — the frontend replaces these with the profession-specific list from /assessment/detect-skills.
    options: GENERIC_SKILL_POOL,
  },
  {
    id: "interests",
    title: "Áreas de Interés",
    description: "Selecciona los sectores o temas que más te interesan",
    type: "multi-select",
    options: ["IA y Tecnología", "Marketing Digital", "Liderazgo", "Finanzas", "Emprendimiento", "Salud Digital"],
  },
  {
    id: "goal",
    title: "Tus Metas",
    description: "¿Qué buscas lograr y cuánto tiempo puedes dedicar por semana?",
    type: "goal-form",
  },
];

export function computeAssessment(answers: AssessmentAnswers) {
  const resultSkills: SkillResult[] = answers.currentSkills.map((s) => ({
    name: s.name,
    level: Math.max(0, Math.min(100, Math.round(s.level))),
  }));

  const avg = (names: string[]) => {
    const matches = resultSkills.filter((s) => names.includes(s.name));
    if (matches.length === 0) return 50;
    return matches.reduce((sum, s) => sum + s.level, 0) / matches.length;
  };

  const softAvg = avg(SOFT_SKILLS);
  const digitalAvg = avg(DIGITAL_SKILLS);

  const text = answers.experienceText.toLowerCase();
  const automationKeywordHits = AUTOMATION_PRONE_KEYWORDS.filter((kw) => text.includes(kw)).length;

  let automationRisk = 60 - Math.round(softAvg * 0.3) - Math.round(digitalAvg * 0.15) + automationKeywordHits * 10;
  automationRisk = Math.max(5, Math.min(95, automationRisk));

  let adaptationPotential = 40 + Math.round(digitalAvg * 0.3) + Math.round(softAvg * 0.2) + Math.round(answers.weeklyHours * 2);
  adaptationPotential = Math.max(5, Math.min(98, adaptationPotential));

  const recommendedSkills = DEMAND_DATASET.filter((d) => {
    const owned = resultSkills.find((s) => s.name === d.name);
    return !owned || owned.level < 70;
  });

  const employabilityScore = Math.round((100 - automationRisk) * 0.4 + adaptationPotential * 0.4 + digitalAvg * 0.2);

  return {
    resultSkills,
    automationRisk,
    adaptationPotential,
    recommendedSkills: recommendedSkills.length > 0 ? recommendedSkills : DEMAND_DATASET,
    employabilityScore: Math.max(1, Math.min(100, employabilityScore)),
  };
}

export function heuristicSummary(answers: AssessmentAnswers, computed: ReturnType<typeof computeAssessment>) {
  const strong = computed.resultSkills.filter((s) => s.level >= 75).map((s) => s.name);
  const weak = computed.resultSkills.filter((s) => s.level < 50).map((s) => s.name);
  const parts = [
    strong.length
      ? `Tus fortalezas principales son ${strong.join(", ")}.`
      : "Aún no identificamos fortalezas claras — completa más evaluaciones.",
    weak.length ? `Hay oportunidad de mejora en ${weak.join(", ")}.` : "",
    `Riesgo de automatización: ${computed.automationRisk}%. Potencial de adaptación: ${computed.adaptationPotential}%.`,
  ];
  return parts.filter(Boolean).join(" ");
}

export interface DetectedSkill {
  name: string;
  level: number;
  detected: boolean;
}

/**
 * Pre-fills the skill-sliders step from real evidence (the profession's ATS keyword bank matched
 * against the free-text experience answer, plus whatever the CV upload step already extracted)
 * instead of defaulting every slider to a flat, arbitrary-feeling 50.
 */
export function detectSkillLevels(experienceText: string, cvExtractedSkills: string[] = []): DetectedSkill[] {
  const profile = detectProfession(experienceText);
  const lower = experienceText.toLowerCase();

  const candidates = Array.from(new Set([...profile.atsKeywords, ...GENERIC_SKILL_POOL]));

  const fromText: DetectedSkill[] = candidates.map((name) => ({
    name,
    level: lower.includes(name.toLowerCase()) ? 75 : 35,
    detected: lower.includes(name.toLowerCase()),
  }));

  const fromCv: DetectedSkill[] = cvExtractedSkills.map((name) => ({ name, level: 70, detected: true }));

  const merged = new Map<string, DetectedSkill>();
  for (const skill of [...fromCv, ...fromText]) {
    const key = skill.name.toLowerCase();
    const existing = merged.get(key);
    if (!existing || skill.level > existing.level) merged.set(key, skill);
  }

  return Array.from(merged.values())
    .sort((a, b) => Number(b.detected) - Number(a.detected) || b.level - a.level)
    .slice(0, 8);
}
