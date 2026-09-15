// Deterministic heuristic scoring for the assessment wizard.
// This is intentionally rule-based (not a trained ML model) so results are explainable and
// reproducible without external dependencies. When ANTHROPIC_API_KEY is configured, the free-text
// "experiencia previa" answer is additionally sent to Claude to enrich the textual summary.

export interface AssessmentAnswers {
  experienceText: string;
  currentSkills: { name: string; level: number }[];
  interests: string[];
  goal: string;
  weeklyHours: number;
  // Carried through only for storage/recall (GET /latest re-reads it to pick the right
  // DEMAND_BY_PROFESSION bucket) — not used by the scoring math itself.
  professionId?: string;
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

// Names must match real BehaviorQuestion `skill` fields (CENTURY21_BEHAVIOR_QUESTIONS /
// profession behaviorQuestions) so these averages reflect actual quiz-measured levels instead of
// silently falling back to the 50 default because no resultSkill matches the name.
const SOFT_SKILLS = ["Colaboración en equipos multiculturales", "Comunicación efectiva"];
const DIGITAL_SKILLS = ["Alfabetización digital", "Gestión de la información"];

const AUTOMATION_PRONE_KEYWORDS = [
  "manufactura",
  "producción en línea",
  "captura de datos",
  "digitación",
  "cajero",
  "ensamblaje",
  "operativo repetitivo",
];

// Fallback used only for the "general" profile or a profession id not covered below.
export const DEMAND_DATASET: RecommendedSkill[] = [
  { name: "Inteligencia Artificial", demand: "Demanda Alta", growthPct: 145 },
  { name: "Marketing Digital", demand: "Demanda Alta", growthPct: 98 },
  { name: "Análisis de Datos", demand: "Demanda Media-Alta", growthPct: 112 },
  { name: "Gestión Remota", demand: "Demanda Alta", growthPct: 87 },
];

// Recommending the same 4 generic tech/marketing skills to every single person regardless of their
// actual profession (a biologist and a lawyer both seeing "Inteligencia Artificial" and "Gestión
// Remota" as their top growth areas) isn't personalization — it just looks like it. Each bucket's
// names are drawn from that profession's own curated `interestAreas` in professionProfiles.ts (real
// growth areas within that field), so "recommended for you" actually depends on who you are.
export const DEMAND_BY_PROFESSION: Record<string, RecommendedSkill[]> = {
  educacion: [
    { name: "Tecnología Educativa (EdTech)", demand: "Demanda Alta", growthPct: 92 },
    { name: "Educación Inclusiva", demand: "Demanda Media-Alta", growthPct: 58 },
    { name: "Neuroeducación", demand: "Demanda Media", growthPct: 44 },
  ],
  "ciencias-investigacion": [
    { name: "Bioinformática", demand: "Demanda Alta", growthPct: 110 },
    { name: "Biotecnología", demand: "Demanda Alta", growthPct: 95 },
    { name: "Divulgación Científica", demand: "Demanda Media", growthPct: 40 },
  ],
  salud: [
    { name: "Telemedicina", demand: "Demanda Alta", growthPct: 130 },
    { name: "Salud Mental", demand: "Demanda Alta", growthPct: 105 },
    { name: "Gerontología y Cuidado del Adulto Mayor", demand: "Demanda Alta", growthPct: 88 },
  ],
  "contabilidad-finanzas": [
    { name: "Fintech", demand: "Demanda Alta", growthPct: 120 },
    { name: "Automatización Contable", demand: "Demanda Alta", growthPct: 90 },
    { name: "Finanzas Sostenibles (ESG)", demand: "Demanda Media-Alta", growthPct: 75 },
  ],
  "ingenieria-tecnologia": [
    { name: "Inteligencia Artificial", demand: "Demanda Alta", growthPct: 145 },
    { name: "Ciberseguridad", demand: "Demanda Alta", growthPct: 132 },
    { name: "Computación en la Nube", demand: "Demanda Alta", growthPct: 108 },
  ],
  "ventas-comercial": [
    { name: "E-commerce", demand: "Demanda Alta", growthPct: 100 },
    { name: "Automatización de Ventas (Sales Ops)", demand: "Demanda Alta", growthPct: 85 },
    { name: "Experiencia del Cliente (CX)", demand: "Demanda Media-Alta", growthPct: 70 },
  ],
  "administracion-rrhh": [
    { name: "People Analytics", demand: "Demanda Alta", growthPct: 95 },
    { name: "Trabajo Remoto e Híbrido", demand: "Demanda Alta", growthPct: 87 },
    { name: "Diversidad e Inclusión", demand: "Demanda Media-Alta", growthPct: 60 },
  ],
  "marketing-comunicaciones": [
    { name: "Inteligencia Artificial en Marketing", demand: "Demanda Alta", growthPct: 118 },
    { name: "Marketing de Contenidos", demand: "Demanda Alta", growthPct: 90 },
    { name: "Comunicación Digital", demand: "Demanda Alta", growthPct: 85 },
  ],
  "operaciones-logistica": [
    { name: "Automatización y Robótica", demand: "Demanda Alta", growthPct: 100 },
    { name: "Analítica de Operaciones", demand: "Demanda Alta", growthPct: 92 },
    { name: "Logística Sostenible", demand: "Demanda Media-Alta", growthPct: 65 },
  ],
  legal: [
    { name: "Legaltech", demand: "Demanda Alta", growthPct: 96 },
    { name: "Derecho Digital y Protección de Datos", demand: "Demanda Alta", growthPct: 88 },
    { name: "Compliance y Ética Corporativa", demand: "Demanda Media-Alta", growthPct: 70 },
  ],
};

function demandSkillsFor(professionId: string | undefined): RecommendedSkill[] {
  if (professionId && DEMAND_BY_PROFESSION[professionId]) return DEMAND_BY_PROFESSION[professionId];
  return DEMAND_DATASET;
}

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
    title: "Preguntas de Habilidades",
    description: "Preguntas puntuales sobre cómo trabajas — no una estimación a partir de tu texto",
    type: "quiz",
  },
  {
    id: "interests",
    title: "Áreas de Interés",
    description: "Selecciona los sectores o temas que más te interesan — basado en las 6 áreas de interés ocupacional RIASEC que usa O*NET",
    type: "multi-select",
    options: [
      { label: "IA y Tecnología", riasecDimension: "I" },
      { label: "Marketing Digital", riasecDimension: "E" },
      { label: "Liderazgo", riasecDimension: "E" },
      { label: "Finanzas", riasecDimension: "C" },
      { label: "Emprendimiento", riasecDimension: "E" },
      { label: "Salud Digital", riasecDimension: "I" },
    ],
  },
  {
    id: "goal",
    title: "Tus Metas",
    description: "¿Qué buscas lograr y cuánto tiempo puedes dedicar por semana?",
    type: "goal-form",
  },
];

export function computeAssessment(answers: AssessmentAnswers, professionId?: string) {
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

  const employabilityScore = Math.round((100 - automationRisk) * 0.4 + adaptationPotential * 0.4 + digitalAvg * 0.2);

  return {
    resultSkills,
    automationRisk,
    adaptationPotential,
    recommendedSkills: computeRecommendedSkills(resultSkills, professionId),
    employabilityScore: Math.max(1, Math.min(100, employabilityScore)),
  };
}

// Deterministic from resultSkills + professionId alone, so a stored Assessment row (which persists
// resultSkills and, since this change, the detected professionId inside `answers`) can recompute
// the same recommendations later — e.g. for a returning user's GET /latest — without having to
// also store the derived list redundantly.
export function computeRecommendedSkills(resultSkills: SkillResult[], professionId?: string): RecommendedSkill[] {
  const dataset = demandSkillsFor(professionId);
  const recommendedSkills = dataset.filter((d) => {
    const owned = resultSkills.find((s) => s.name === d.name);
    return !owned || owned.level < 70;
  });
  return recommendedSkills.length > 0 ? recommendedSkills : dataset;
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

/**
 * Scores a BARS (behaviorally-anchored rating scale) answer: the option index selected out of a
 * 5-anchor low-to-high frequency scale maps to a level on a fixed 25-90 scale, not a free 0-100
 * guess — same formula used for both the initial evaluation quiz and the Actualización quiz, so a
 * given answer always means the same thing regardless of where it was answered.
 */
export function scoreBarsAnswer(selectedIndex: number, optionsCount: number): number {
  const maxIdx = optionsCount - 1;
  const clampedIndex = Math.max(0, Math.min(maxIdx, selectedIndex));
  return Math.round(25 + (clampedIndex / maxIdx) * 65); // 25 / 41 / 58 / 74 / 90 for a 5-option scale
}
