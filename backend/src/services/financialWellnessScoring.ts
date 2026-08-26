// Deterministic, explainable financial-priority recommendation — same philosophy as
// assessmentScoring.ts/pensionEstimate.ts: rule-based on real, citable personal-finance principles,
// not an opaque model, so a person can see exactly why a recommendation was made.
//
// Grounded in two widely-cited, non-controversial standards:
// - Emergency fund of 3-6 months of essential expenses before investing (common guidance from
//   sources like the U.S. CFPB and most personal-finance curricula).
// - "Debt avalanche" method: pay the highest-interest debt first — eliminating a 15%+ interest
//   rate is a guaranteed "return" that beats the realistic long-run return of most diversified
//   investments, so it takes priority over investing while it exists.

export interface Debt {
  name: string;
  amount: number;
  interestRatePct: number; // annual, e.g. 28 for a 28% APR credit card
}

export interface FinancialWellnessInput {
  monthlyIncome: number;
  monthlyExpenses?: number;
  debts?: Debt[];
  emergencyFund?: number;
}

export type FinancialPriority = "general" | "debt" | "emergency_fund" | "invest" | "balanced";

export interface FinancialRecommendation {
  priority: FinancialPriority;
  rationale: string;
  steps: string[];
  highestInterestDebt?: Debt;
  emergencyFundMonthsCovered?: number;
}

// Debt at or above this rate is treated as "high interest" — well above realistic long-run
// investment return expectations (~7-8% real for diversified equities), and roughly where LATAM
// consumer credit (credit cards, personal loans) commonly sits or above.
const HIGH_INTEREST_THRESHOLD_PCT = 15;
const EMERGENCY_FUND_MIN_MONTHS = 3;
const EMERGENCY_FUND_FULL_MONTHS = 6;

function formatMonths(months: number): string {
  return months === 1 ? "1 mes" : `${months} meses`;
}

export function computeFinancialRecommendation(input: FinancialWellnessInput): FinancialRecommendation {
  const { monthlyIncome, monthlyExpenses, emergencyFund } = input;
  const debts = input.debts || [];
  const hasExpenses = monthlyExpenses !== undefined && monthlyExpenses > 0;
  const hasEmergencyFund = emergencyFund !== undefined;

  // Only income given — no expenses, debts, or savings data at all. Honest general guidance
  // instead of pretending to a precision the data doesn't support.
  if (!hasExpenses && debts.length === 0 && !hasEmergencyFund) {
    return {
      priority: "general",
      rationale:
        "Con solo tu ingreso no podemos dar una recomendación específica a tu situación real — agrega tus gastos, deudas o ahorros para una respuesta más precisa.",
      steps: [
        "Regla general de referencia (50/30/20): aproximadamente 50% del ingreso a necesidades básicas, 30% a gastos personales, y 20% a ahorro o pago de deudas.",
        "Si tienes deudas con tasas de interés altas (tarjetas de crédito, créditos de consumo), priorízalas antes de ahorrar o invertir.",
        "Si no tienes un fondo de emergencia, el primer paso suele ser ahorrar entre 1 y 3 meses de gastos básicos antes de invertir.",
      ],
    };
  }

  // Approximate expenses as half of income when not given, so the emergency-fund math below is
  // always computable — documented as an approximation, never presented as exact.
  const effectiveExpenses = hasExpenses ? monthlyExpenses! : monthlyIncome * 0.5;
  const monthsCovered = hasEmergencyFund ? Math.round((emergencyFund! / effectiveExpenses) * 10) / 10 : undefined;

  const highInterestDebts = debts
    .filter((d) => d.interestRatePct >= HIGH_INTEREST_THRESHOLD_PCT)
    .sort((a, b) => b.interestRatePct - a.interestRatePct);

  if (highInterestDebts.length > 0) {
    const worst = highInterestDebts[0];
    return {
      priority: "debt",
      highestInterestDebt: worst,
      emergencyFundMonthsCovered: monthsCovered,
      rationale: `Tienes deuda con una tasa de interés alta (${worst.name}, ${worst.interestRatePct}% anual). Pagarla primero equivale a una inversión garantizada a esa misma tasa — casi ninguna inversión ofrece ese retorno de forma segura, por eso el método de "avalancha de deudas" prioriza pagar primero la deuda más cara.`,
      steps: [
        `Destina tu excedente mensual a pagar "${worst.name}" lo más rápido posible, mantén solo los pagos mínimos en tus otras deudas.`,
        ...(highInterestDebts.length > 1
          ? ["Una vez pagada esa deuda, repite el proceso con la siguiente de mayor tasa de interés."]
          : []),
        ...(monthsCovered === undefined || monthsCovered < 1
          ? ["Mientras tanto, intenta mantener un pequeño colchón de al menos 1 mes de gastos, para no volver a endeudarte ante un imprevisto."]
          : []),
      ],
    };
  }

  if (hasEmergencyFund && monthsCovered! < EMERGENCY_FUND_MIN_MONTHS) {
    return {
      priority: "emergency_fund",
      emergencyFundMonthsCovered: monthsCovered,
      rationale: `Tu fondo de emergencia cubre aproximadamente ${formatMonths(monthsCovered!)} de gastos — la guía estándar recomienda entre 3 y 6 meses antes de invertir, para no tener que vender inversiones o endeudarte ante un imprevisto.`,
      steps: [
        "Prioriza completar tu fondo de emergencia hasta cubrir al menos 3 meses de tus gastos básicos.",
        "Mantenlo en una cuenta de fácil acceso, no en inversiones de riesgo — su función es estar disponible de inmediato.",
        ...(debts.length > 0 ? ["Sigue pagando al menos el mínimo de tus deudas actuales mientras construyes este fondo."] : []),
      ],
    };
  }

  if (hasEmergencyFund && monthsCovered! >= EMERGENCY_FUND_FULL_MONTHS && debts.length === 0) {
    return {
      priority: "invest",
      emergencyFundMonthsCovered: monthsCovered,
      rationale: `Tu fondo de emergencia ya cubre ${formatMonths(monthsCovered!)} de gastos y no tienes deudas pendientes — con esa base, el siguiente paso lógico es hacer crecer tu dinero en vez de mantenerlo solo en ahorro.`,
      steps: [
        "Considera destinar tu excedente mensual a instrumentos de inversión acordes a tu horizonte de tiempo y tolerancia al riesgo.",
        "Mantén tu fondo de emergencia intacto — no lo uses para invertir.",
      ],
    };
  }

  return {
    priority: "balanced",
    emergencyFundMonthsCovered: monthsCovered,
    rationale:
      "Tu situación no tiene una prioridad única y urgente — no hay deuda de interés alto pendiente, pero tampoco un colchón de emergencia completo. Lo más equilibrado es repartir tu excedente entre ambos objetivos.",
    steps: [
      "Destina una parte de tu excedente mensual a completar tu fondo de emergencia hasta 3-6 meses de gastos.",
      ...(debts.length > 0 ? ["Destina otra parte a seguir reduciendo tus deudas restantes, aunque no sean de interés alto."] : []),
      "Una vez tengas ambos frentes cubiertos, redirige el excedente hacia inversión.",
    ],
  };
}
