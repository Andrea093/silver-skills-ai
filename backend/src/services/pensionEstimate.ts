// Simplified, transparent pension-projection formula for the MVP — not an actuarial engine, and
// never presented as one (the UI always shows the disclaimer). Kept as an isolated module so a
// future phase can swap this for a real Colpensiones/Porvenir integration without touching the
// route or the UI, per the spec's own "prepare an integration point" request.
//
// Redesigned from a "pick one hypothetical scenario, see one number" selector (confusing — people
// don't know in advance which lever to even ask about) into computing every real lever at once
// from the data the person already entered, and pointing at whichever one the numbers actually
// favor for them — same spirit as fixing the recommended-skills dataset in assessmentScoring.ts:
// showing the same options to everyone regardless of their real inputs isn't personalization.

export type Regime = "rpm" | "rais" | "unknown";
export type PensionScenario = "same" | "formalize" | "change_regime" | "voluntary_contributions";

export interface PensionEstimateInput {
  age: number;
  weeksContributed?: number;
  yearsWorkedEstimate?: number;
  currentIncome: number;
  regime: Regime;
  // Optional — when given, the aporte voluntario scenario is computed from this real amount
  // instead of an illustrative flat percentage, so "¿cuánto debería aportar?" has a real answer.
  voluntaryMonthlyAmount?: number;
}

export interface PensionAmount {
  amount: number;
  low: number;
  high: number;
}

export interface ScenarioProjection {
  scenario: PensionScenario;
  label: string;
  amount: PensionAmount;
  deltaPct: number;
  // What concrete action this implies (separate from why it does/doesn't move the number).
  explanation: string;
}

export interface PensionProjectionResult {
  weeksContributedUsed: number;
  baseline: PensionAmount;
  scenarios: ScenarioProjection[];
  // Whichever scenario the numbers actually favor for this person's own inputs — not a fixed
  // default, see recommendedScenarioFor below.
  recommendedScenario: PensionScenario;
  recommendationRationale: string;
  // Since the projection is directly proportional to currentIncome, this is exactly how much
  // income would need to rise, in %, to raise the projection by that same % — answers "¿cuánto
  // debería subir mi ingreso?" with a real number instead of a vague "more".
  incomeIncreaseForTenPctGain: number;
}

// A full Colombian pension career is conventionally 1300 weeks (25 years) — used here only as the
// denominator for a 0-1 "replacement rate" scale, not as a real RPM/RAIS eligibility threshold.
const FULL_CAREER_WEEKS = 1300;
const MIN_REPLACEMENT_RATE = 0.35;
const MAX_REPLACEMENT_RATE = 0.75;
const PROJECTION_RANGE_PCT = 0.15;
const FULL_CAREER_NEAR_THRESHOLD = 0.8;

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

const SCENARIO_LABELS: Record<PensionScenario, string> = {
  same: "Seguir igual",
  formalize: "Formalizarte",
  change_regime: "Cambiar de régimen",
  voluntary_contributions: "Aporte voluntario",
};

// What each scenario actually means to DO, in concrete terms.
export const SCENARIO_EXPLANATIONS: Record<PensionScenario, string> = {
  same: "No cambias nada en tu situación laboral actual — sigues cotizando exactamente igual que hoy.",
  formalize: "Pasar de un trabajo informal o independiente sin cotizar a un esquema donde sí cotizas cada mes (contrato laboral formal, BEPS, o PILA como independiente). Cada semana que antes no contaba para tu pensión, empieza a contar.",
  change_regime: "Cambiarte de RAIS (fondo privado: Porvenir, Protección, Colfondos — tu propio ahorro acumulado) a RPM (Colpensiones — pensión definida por tus semanas y salario), o viceversa. Es una decisión real y en general no reversible libremente: cuál conviene depende de tu caso (semanas cotizadas, edad, ingreso), no de un cálculo genérico — este simulador no reemplaza una asesoría con Colpensiones o tu fondo.",
  voluntary_contributions: "Meter dinero extra, además de tu cotización obligatoria, directamente a tu cuenta de pensión (aporte voluntario en tu fondo/AFP o cuenta AVC). Aumenta tu capital acumulado de forma directa, sin depender de cambiar de trabajo.",
};

function multiplierFor(scenario: PensionScenario, input: PensionEstimateInput): number {
  switch (scenario) {
    case "same":
      return 1;
    // Formalizing closes the informality gap: contributions start counting toward weeks
    // cotizadas that otherwise wouldn't exist at all.
    case "formalize":
      return 1.22;
    // No real actuarial basis for a single multiplier here — which regime is better is a
    // genuinely personal decision (see SCENARIO_EXPLANATIONS above), so this deliberately
    // doesn't pretend a number can capture it.
    case "change_regime":
      return 1;
    // Voluntary contributions add directly to accumulated capital — when the person tells us a
    // real monthly amount, the effect is computed from that (roughly proportional to how much
    // extra that is relative to their income) instead of a flat illustrative bump.
    case "voluntary_contributions": {
      if (input.voluntaryMonthlyAmount && input.voluntaryMonthlyAmount > 0 && input.currentIncome > 0) {
        const extraRatio = input.voluntaryMonthlyAmount / input.currentIncome;
        return 1 + Math.min(0.6, extraRatio); // capped so an unrealistic input doesn't blow up the projection
      }
      return 1.18;
    }
  }
}

/**
 * Which lever the numbers actually favor for this person, not a fixed default: formalizing only
 * helps by adding weeks cotizadas, so once someone is already close to a full career (few weeks
 * left to add), that lever has little room left — a voluntary contribution matters more at that
 * point. change_regime is never auto-recommended (see multiplierFor) since it's a personal decision.
 */
function recommendedScenarioFor(weeksContributedUsed: number, scenarios: ScenarioProjection[]): { scenario: PensionScenario; rationale: string } {
  const nearFullCareer = weeksContributedUsed / FULL_CAREER_WEEKS >= FULL_CAREER_NEAR_THRESHOLD;
  if (!nearFullCareer) {
    const formalize = scenarios.find((s) => s.scenario === "formalize")!;
    return {
      scenario: "formalize",
      rationale: `Aún te faltan bastantes semanas para completar una carrera cotizada — formalizarte es la palanca con más impacto en tu proyección ahora mismo (+${formalize.deltaPct}%).`,
    };
  }
  const voluntary = scenarios.find((s) => s.scenario === "voluntary_contributions")!;
  return {
    scenario: "voluntary_contributions",
    rationale: `Ya llevas la mayoría de las semanas de una carrera completa cotizadas — a esta altura, un aporte voluntario mueve más la aguja que formalizarte (+${voluntary.deltaPct}%).`,
  };
}

export function computePensionProjection(input: PensionEstimateInput): PensionProjectionResult {
  const weeks = estimateWeeksContributed(input.age, input.weeksContributed, input.yearsWorkedEstimate);
  const rate = replacementRate(weeks);
  const baselineAmount = input.currentIncome * rate;

  const scenarios: ScenarioProjection[] = (["same", "formalize", "change_regime", "voluntary_contributions"] as PensionScenario[]).map(
    (scenario) => {
      const multiplier = multiplierFor(scenario, input);
      return {
        scenario,
        label: SCENARIO_LABELS[scenario],
        amount: withRange(baselineAmount * multiplier),
        deltaPct: Math.round((multiplier - 1) * 100),
        explanation: SCENARIO_EXPLANATIONS[scenario],
      };
    }
  );

  const { scenario: recommendedScenario, rationale } = recommendedScenarioFor(weeks, scenarios);

  return {
    weeksContributedUsed: weeks,
    baseline: withRange(baselineAmount),
    scenarios,
    recommendedScenario,
    recommendationRationale: rationale,
    incomeIncreaseForTenPctGain: 10,
  };
}
