// Simplified, transparent pension-projection formula for the MVP — not an actuarial engine, and
// never presented as one (the UI always shows the disclaimer). Kept as an isolated module so a
// future phase can swap this for a real Colpensiones/Porvenir integration without touching the
// route or the UI, per the spec's own "prepare an integration point" request.

export type Regime = "rpm" | "rais" | "unknown";
export type PensionScenario = "same" | "formalize" | "change_sector" | "voluntary_contributions";

export interface PensionEstimateInput {
  age: number;
  weeksContributed?: number;
  yearsWorkedEstimate?: number;
  currentIncome: number;
  regime: Regime;
  scenario: PensionScenario;
}

export interface PensionAmount {
  amount: number;
  low: number;
  high: number;
}

export interface PensionProjectionResult {
  weeksContributedUsed: number;
  baseline: PensionAmount;
  scenario: PensionAmount;
  scenarioDeltaPct: number;
  recommendation: string;
}

// A full Colombian pension career is conventionally 1300 weeks (25 years) — used here only as the
// denominator for a 0-1 "replacement rate" scale, not as a real RPM/RAIS eligibility threshold.
const FULL_CAREER_WEEKS = 1300;
const MIN_REPLACEMENT_RATE = 0.35;
const MAX_REPLACEMENT_RATE = 0.75;
const PROJECTION_RANGE_PCT = 0.15;

/**
 * Weeks cotizadas is the real input a pension formula needs, but many users won't know their exact
 * number — falls back to a rough estimate from self-reported years worked (52 weeks/year, capped
 * at what's plausible given their current age so a 50-year-old can't report 60 years worked).
 */
export function estimateWeeksContributed(age: number, weeksContributed?: number, yearsWorkedEstimate?: number): number {
  if (weeksContributed && weeksContributed > 0) return Math.round(weeksContributed);
  const maxPlausibleYears = Math.max(0, age - 16); // earliest plausible start of working life
  const years = Math.min(yearsWorkedEstimate || 0, maxPlausibleYears);
  return Math.round(years * 52);
}

function replacementRate(weeks: number): number {
  const ratio = Math.min(1, weeks / FULL_CAREER_WEEKS);
  return MIN_REPLACEMENT_RATE + ratio * (MAX_REPLACEMENT_RATE - MIN_REPLACEMENT_RATE);
}

function withRange(amount: number): PensionAmount {
  return {
    amount: Math.round(amount),
    low: Math.round(amount * (1 - PROJECTION_RANGE_PCT)),
    high: Math.round(amount * (1 + PROJECTION_RANGE_PCT)),
  };
}

// Illustrative multipliers over the baseline projection — each documents the real-world lever it
// represents, not a precise actuarial effect.
const SCENARIO_MULTIPLIERS: Record<PensionScenario, number> = {
  same: 1,
  // Formalizing closes the informality gap: contributions start counting toward weeks cotizadas
  // that otherwise wouldn't exist at all.
  formalize: 1.22,
  // Changing sector has an up-front adjustment cost (new role, possibly lower initial income)
  // before any long-term upside materializes, so this scenario alone is modeled as flat-to-slightly-down.
  change_sector: 0.97,
  // Voluntary additional contributions (RAIS-style) directly increase the accumulated capital.
  voluntary_contributions: 1.18,
};

const SCENARIO_RECOMMENDATIONS: Record<PensionScenario, string> = {
  same: "Mantener tu situación actual sin ajustes deja tu proyección donde está hoy. Si te preocupa la cifra, explora formalizarte o aumentar tus aportes voluntarios — ambos tienen más impacto que cambiar de sector por sí solo.",
  formalize: "Formalizarte es una de las palancas más fuertes: cada semana cotizada adicional cuenta directamente para tu pensión futura, algo que la informalidad no permite.",
  change_sector: "Cambiar de sector por sí solo no mejora tu proyección de forma directa — su valor está en abrirte a mejores ingresos o estabilidad, que sí puedes reforzar después con aportes voluntarios.",
  voluntary_contributions: "Aumentar tus aportes voluntarios es de las formas más directas de subir tu ingreso proyectado, incluso con montos bajos si empiezas ahora.",
};

export function computePensionProjection(input: PensionEstimateInput): PensionProjectionResult {
  const weeks = estimateWeeksContributed(input.age, input.weeksContributed, input.yearsWorkedEstimate);
  const rate = replacementRate(weeks);
  const baselineAmount = input.currentIncome * rate;

  const multiplier = SCENARIO_MULTIPLIERS[input.scenario];
  const scenarioAmount = baselineAmount * multiplier;

  return {
    weeksContributedUsed: weeks,
    baseline: withRange(baselineAmount),
    scenario: withRange(scenarioAmount),
    scenarioDeltaPct: Math.round((multiplier - 1) * 100),
    recommendation: SCENARIO_RECOMMENDATIONS[input.scenario],
  };
}
