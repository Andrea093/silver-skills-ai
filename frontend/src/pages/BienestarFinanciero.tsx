import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Info, Plus, Trash2, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import { FinancialDebt, FinancialWellnessInputPayload, FinancialWellnessResponse, FinancialPriority } from "../types";
import { ModuleStepper } from "../components/ModuleStepper";

const PRIORITY_LABELS: Record<FinancialPriority, string> = {
  general: "Guía general",
  debt: "Prioriza pagar deuda",
  emergency_fund: "Prioriza tu fondo de emergencia",
  invest: "Puedes invertir tu excedente",
  balanced: "Reparte entre deuda y ahorro",
};

const PRIORITY_TONES: Record<FinancialPriority, "brand" | "success" | "neutral" | "accent"> = {
  general: "neutral",
  debt: "accent",
  emergency_fund: "accent",
  invest: "success",
  balanced: "brand",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

interface DebtRow {
  name: string;
  amount: string;
  interestRatePct: string;
}

export function BienestarFinanciero() {
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [emergencyFund, setEmergencyFund] = useState("");
  const [debtRows, setDebtRows] = useState<DebtRow[]>([]);

  const [result, setResult] = useState<FinancialWellnessResponse | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<FinancialWellnessResponse>("/financial-wellness/latest")
      .then((res) => {
        setResult(res);
        setMonthlyIncome(String(res.input.monthlyIncome));
        setMonthlyExpenses(res.input.monthlyExpenses !== undefined ? String(res.input.monthlyExpenses) : "");
        setEmergencyFund(res.input.emergencyFund !== undefined ? String(res.input.emergencyFund) : "");
        setDebtRows(
          (res.input.debts || []).map((d) => ({
            name: d.name,
            amount: String(d.amount),
            interestRatePct: String(d.interestRatePct),
          }))
        );
      })
      .catch(() => {
        // no previous data yet — start with an empty form
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  function addDebtRow() {
    setDebtRows((prev) => [...prev, { name: "", amount: "", interestRatePct: "" }]);
  }

  function removeDebtRow(index: number) {
    setDebtRows((prev) => prev.filter((_, i) => i !== index));
  }

  function updateDebtRow(index: number, field: keyof DebtRow, value: string) {
    setDebtRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const incomeNum = Number(monthlyIncome);
    if (!incomeNum || incomeNum <= 0) {
      setError("Ingresa tu ingreso mensual para obtener una recomendación.");
      return;
    }

    const debts: FinancialDebt[] = debtRows
      .filter((row) => row.name.trim() && row.amount && row.interestRatePct)
      .map((row) => ({
        name: row.name.trim(),
        amount: Number(row.amount),
        interestRatePct: Number(row.interestRatePct),
      }));

    const payload: FinancialWellnessInputPayload = {
      monthlyIncome: incomeNum,
      ...(monthlyExpenses ? { monthlyExpenses: Number(monthlyExpenses) } : {}),
      ...(emergencyFund ? { emergencyFund: Number(emergencyFund) } : {}),
      ...(debts.length > 0 ? { debts } : {}),
    };

    setSubmitting(true);
    try {
      const res = await api.post<FinancialWellnessResponse>("/financial-wellness", payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "No pudimos calcular tu recomendación. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bienestar Financiero</h1>
        <p className="text-gray-500">
          Cuéntanos tu situación actual y te ayudamos a decidir si conviene pagar deudas, ahorrar o
          invertir primero
        </p>
      </div>

      <Card className="border border-brand-100 bg-brand-50/60">
        <div className="mb-2 flex items-center gap-2 text-brand-900">
          <Info size={17} strokeWidth={2.25} />
          <h2 className="font-semibold">Cómo funciona esta recomendación</h2>
        </div>
        <p className="text-sm text-brand-900">
          Solo tu ingreso es obligatorio. Entre más datos agregues (gastos, deudas, fondo de
          emergencia), más precisa será la recomendación — se basa en reglas estándar de finanzas
          personales (fondo de emergencia de 3-6 meses, priorizar deudas de interés alto), no en una
          estimación genérica.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Tu situación</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fw-income" className={labelClass}>
              Ingreso mensual (en tu moneda local)
            </label>
            <input
              id="fw-income"
              type="number"
              min={0}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="Ej. 2500000"
              className={`${inputClass} sm:w-64`}
            />
          </div>

          <div>
            <label htmlFor="fw-expenses" className={labelClass}>
              Gastos fijos mensuales (opcional)
            </label>
            <input
              id="fw-expenses"
              type="number"
              min={0}
              value={monthlyExpenses}
              onChange={(e) => setMonthlyExpenses(e.target.value)}
              placeholder="Ej. 1800000"
              className={`${inputClass} sm:w-64`}
            />
          </div>

          <div>
            <label htmlFor="fw-emergency" className={labelClass}>
              Fondo de ahorro / emergencia actual (opcional)
            </label>
            <input
              id="fw-emergency"
              type="number"
              min={0}
              value={emergencyFund}
              onChange={(e) => setEmergencyFund(e.target.value)}
              placeholder="Ej. 3000000"
              className={`${inputClass} sm:w-64`}
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={labelClass.replace("mb-1", "mb-0")}>Deudas existentes (opcional)</label>
              <Button type="button" variant="outline" size="md" icon={Plus} onClick={addDebtRow}>
                Agregar deuda
              </Button>
            </div>
            {debtRows.length === 0 && (
              <p className="text-xs text-gray-500">Sin deudas registradas. Agrega una si tienes.</p>
            )}
            <div className="space-y-3">
              {debtRows.map((row, i) => (
                <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-3">
                  <div className="flex-1 basis-40">
                    <label className="mb-1 block text-xs text-gray-500">Nombre</label>
                    <input
                      value={row.name}
                      onChange={(e) => updateDebtRow(i, "name", e.target.value)}
                      placeholder="Ej. Tarjeta de crédito"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-32">
                    <label className="mb-1 block text-xs text-gray-500">Monto</label>
                    <input
                      type="number"
                      min={0}
                      value={row.amount}
                      onChange={(e) => updateDebtRow(i, "amount", e.target.value)}
                      placeholder="Ej. 4000000"
                      className={inputClass}
                    />
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs text-gray-500">Interés % anual</label>
                    <input
                      type="number"
                      min={0}
                      value={row.interestRatePct}
                      onChange={(e) => updateDebtRow(i, "interestRatePct", e.target.value)}
                      placeholder="Ej. 28"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDebtRow(i)}
                    className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:border-red-300 hover:text-red-600"
                    aria-label="Quitar deuda"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={15} strokeWidth={2.25} />
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Calculando..." : "Obtener mi recomendación"}
          </Button>
        </form>
      </Card>

      {result && (
        <Card className="border border-brand-100 bg-brand-50">
          <div className="mb-2 flex items-center gap-2">
            <Wallet size={17} strokeWidth={2.25} className="text-brand-700" />
            <Badge tone={PRIORITY_TONES[result.recommendation.priority]}>
              {PRIORITY_LABELS[result.recommendation.priority]}
            </Badge>
          </div>
          <p className="text-sm text-brand-900">{result.recommendation.rationale}</p>
          {result.recommendation.emergencyFundMonthsCovered !== undefined && (
            <p className="mt-1 text-xs text-brand-700">
              Tu fondo de emergencia cubre <strong>{result.recommendation.emergencyFundMonthsCovered}</strong>{" "}
              {result.recommendation.emergencyFundMonthsCovered === 1 ? "mes" : "meses"} de gastos.
            </p>
          )}
          {result.recommendation.steps.length > 0 && (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-brand-900">
              {result.recommendation.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 rounded-lg bg-white/60 px-3 py-2 text-xs text-brand-800">
            Esta es una guía educativa basada en reglas estándar de finanzas personales, no
            asesoría financiera individualizada.
          </p>
        </Card>
      )}

      <ModuleStepper current="bienestar-financiero" />
    </div>
  );
}
