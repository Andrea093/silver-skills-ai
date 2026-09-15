// The assessment wizard's last question ("¿Qué buscas lograr?") is unstructured free text — this
// classifies it as a career-change goal or a stay-and-update goal, so the transition map can pivot
// its job search and framing around the stated goal instead of always assuming the person wants to
// keep doing what their CV already says. Deterministic keyword scoring, same spirit as
// detectProfession — no LLM dependency.

import { detectProfession } from "./professionProfiles";

const CHANGE_KEYWORDS = [
  "cambiar", "cambio de carrera", "cambio de profesión", "nueva carrera", "nuevo campo",
  "otro campo", "otra área", "diferente área", "transicionar a", "transición a", "migrar a",
  "pasar a", "dedicarme a", "reinventarme", "nuevo rumbo", "nueva industria", "nuevo sector",
];

/**
 * Defaults to "stay" when ambiguous — assuming someone wants to abandon their current career from
 * unclear text would be a worse mistake than the reverse (staying focused on their real profession).
 */
export function classifyGoalIntent(goal: string): "change" | "stay" {
  if (!goal || !goal.trim()) return "stay";
  const lower = goal.toLowerCase();
  const hasChangeSignal = CHANGE_KEYWORDS.some((kw) => lower.includes(kw));
  return hasChangeSignal ? "change" : "stay";
}

const LEAD_IN_PHRASES = [
  "quiero cambiar a", "cambiar a", "cambiar hacia", "quiero ser", "quiero dedicarme a",
  "dedicarme a", "transicionar a", "transicionar hacia", "transición a", "migrar a", "pasar a",
  "me gustaría migrar a", "me gustaría cambiar a", "me gustaría dedicarme a", "reinventarme en",
  "hacia", // broad catch-all preposition, checked last so more specific phrases above win first
];

// A goal like "cambiar de empleo" signals wanting *something* different without saying what —
// stripped of filler it reduces to one of these bare, non-specific nouns. Treating that as a real
// "target" used to make it a literal job-search query and a course/program match filter, which
// returned generic irrelevant jobs and zero course matches instead of falling back to what we
// actually know about the person (their CV/profession).
const GENERIC_LEAD_FILLERS = [
  "quiero ", "me gustaría ", "busco ", "buscar ", "conseguir ", "encontrar ",
  "cambiar de ", "cambio de ", "un nuevo ", "una nueva ", "nuevo ", "nueva ",
  "otro ", "otra ", "mi ", "el ", "la ", "un ", "una ",
];

const NON_SPECIFIC_TARGETS = new Set([
  "empleo", "trabajo", "carrera", "profesión", "área", "sector", "puesto", "cargo", "rumbo",
  "industria", "campo", "aire",
]);

function stripGenericFillers(text: string): string {
  let t = text.toLowerCase().trim();
  let changed = true;
  while (changed) {
    changed = false;
    for (const filler of GENERIC_LEAD_FILLERS) {
      if (t.startsWith(filler)) {
        t = t.slice(filler.length).trim();
        changed = true;
      }
    }
  }
  return t;
}

/**
 * Extracts a job-search-worthy target from a change-intent goal, or null when the goal only
 * signals *that* the person wants something different without saying what — callers fall back to
 * the person's real profession/CV in that case instead of searching for a non-specific phrase like
 * "cambiar de empleo" as if it were a job title. Tries the real profession taxonomy first
 * (detectProfession), matching how professions are detected everywhere else in the app; only falls
 * back to stripping known lead-in phrases when nothing in the taxonomy matches.
 */
export function extractGoalTarget(goal: string): string | null {
  const trimmed = goal.trim();
  if (!trimmed) return null;
  const profession = detectProfession(trimmed);
  if (profession.id !== "general") return profession.label;

  // Strip the lead-in phrase that ends latest in the string (not just the first one found in list
  // order), so a longer/more specific lead-in like "cambiar de carrera hacia X" keeps only "X",
  // rather than stopping at whichever phrase happens to appear earliest in the array.
  let cutEnd = 0;
  for (const phrase of LEAD_IN_PHRASES) {
    const idx = trimmed.toLowerCase().indexOf(phrase);
    if (idx !== -1 && idx + phrase.length > cutEnd) cutEnd = idx + phrase.length;
  }
  const stripped = cutEnd > 0 ? trimmed.slice(cutEnd).trim() : trimmed;
  const normalized = stripGenericFillers(stripped);
  if (!normalized || NON_SPECIFIC_TARGETS.has(normalized)) return null;
  return stripped;
}
