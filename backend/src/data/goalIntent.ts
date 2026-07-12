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

/**
 * Extracts a job-search-worthy target from a change-intent goal. Tries the real profession
 * taxonomy first (detectProfession), matching how professions are detected everywhere else in the
 * app; only falls back to stripping known lead-in phrases (then, worst case, the raw goal text)
 * when nothing in the taxonomy matches — so an unusual goal still degrades gracefully into
 * *something* searchable rather than losing the person's stated intent entirely.
 */
export function extractGoalTarget(goal: string): string {
  const trimmed = goal.trim();
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
  return stripped || trimmed;
}
