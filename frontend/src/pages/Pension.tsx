import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, ChevronDown, Info, MessageCircle, Sparkles, Wallet } from "lucide-react";
import { api } from "../lib/api";
import { Card, Button, Badge } from "../components/ui";
import { PensionInputPayload, PensionRegime, PensionResponse } from "../types";
import { FINANCIAL_TOPICS } from "../data/financialTopics";
import { ModuleStepper } from "../components/ModuleStepper";
import { useMentor } from "../context/MentorContext";

const REGIME_OPTIONS: { value: PensionRegime; label: string }[] = [
  { value: "unknown", label: "No lo sé" },
  { value: "rpm", label: "RPM (Régimen de Prima Media)" },
  { value: "rais", label: "RAIS (Régimen de Ahorro Individual)" },
];

function formatCurrency(n: number) {
  return `$${Math.round(n).toLocaleString("es-CO")}`;
}

export function Pension() {
  const { openMentor } = useMentor();

  const [age, setAge] = useState("");
  const [weeksContributed, setWeeksContributed] = useState("");
  const [yearsWorkedEstimate, setYearsWorkedEstimate] = useState("");
  const [currentIncome, setCurrentIncome] = useState("");
  const [regime, setRegime] = useState<PensionRegime>("unknown");
  const [formalStatus, setFormalStatus] = useState<"unknown" | "formal" | "informal">("unknown");
  const [voluntaryMonthlyAmount, setVoluntaryMonthlyAmount] = useState("");

  const [result, setResult] = useState<PensionResponse | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<PensionResponse>("/pension/latest")
      .then((res) => {
        setResult(res);
        setAge(String(res.input.age));
        setWeeksContributed(res.input.weeksContributed ? String(res.input.weeksContributed) : "");
        setYearsWorkedEstimate(res.input.yearsWorkedEstimate ? String(res.input.yearsWorkedEstimate) : "");
        setCurrentIncome(String(res.input.currentIncome));
        setRegime(res.input.regime);
        setFormalStatus(
          res.input.isCurrentlyFormal === true ? "formal" : res.input.isCurrentlyFormal === false ? "informal" : "unknown"
        );
        setVoluntaryMonthlyAmount(res.input.voluntaryMonthlyAmount ? String(res.input.voluntaryMonthlyAmount) : "");
      })
      .catch(() => {
        // no previous projection yet — start with an empty form
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const ageNum = Number(age);
    const incomeNum = Number(currentIncome);
    if (!ageNum || ageNum < 18) {
      setError("Ingresa tu edad para calcular tu proyección.");
      return;
    }
    if (!incomeNum || incomeNum <= 0) {
      setError("Ingresa tu ingreso mensual actual para calcular tu proyección.");
      return;
    }

    const payload: PensionInputPayload = {
      age: ageNum,
      currentIncome: incomeNum,
      regime,
      ...(weeksContributed ? { weeksContributed: Number(weeksContributed) } : {}),
      ...(yearsWorkedEstimate ? { yearsWorkedEstimate: Number(yearsWorkedEstimate) } : {}),
      ...(voluntaryMonthlyAmount ? { voluntaryMonthlyAmount: Number(voluntaryMonthlyAmount) } : {}),
      ...(formalStatus !== "unknown" ? { isCurrentlyFormal: formalStatus === "formal" } : {}),
    };

    setSubmitting(true);
    try {
      const res = await api.post<PensionResponse>("/pension", payload);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "No pudimos calcular tu proyección. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  function talkToMentor(prompt: string) {
    openMentor(prompt);
  }

  if (loadingInitial) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proyección de Pensión</h1>
        <p className="text-gray-500">
          Descubre cómo tus decisiones laborales de hoy pueden cambiar tu ingreso en la vejez
        </p>
      </div>

      <Card className="border border-brand-100 bg-brand-50/60">
        <div className="mb-2 flex items-center gap-2 text-brand-900">
          <Info size={17} strokeWidth={2.25} />
          <h2 className="font-semibold">Cómo usar esta herramienta</h2>
        </div>
        <p className="text-sm text-brand-900">
          Completa tus datos básicos. En vez de pedirte elegir un escenario hipotético, calculamos
          las palancas reales (formalizarte, aporte voluntario, cambio de régimen) a la vez y te
          decimos cuál conviene más según tus propios datos.
        </p>
      </Card>

      <Card>
        <h2 className="mb-4 font-semibold">Tus datos</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pension-age" className="mb-1 block text-sm font-medium text-gray-700">
              Edad actual
            </label>
            <input
              id="pension-age"
              type="number"
              min={18}
              max={100}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ej. 52"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-40"
            />
          </div>

          <div>
            <label htmlFor="pension-weeks" className="mb-1 block text-sm font-medium text-gray-700">
              Semanas cotizadas (si las conoces)
            </label>
            <input
              id="pension-weeks"
              type="number"
              min={0}
              value={weeksContributed}
              onChange={(e) => setWeeksContributed(e.target.value)}
              placeholder="Ej. 900"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-40"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si no lo sabes, déjalo vacío y usa el siguiente campo en su lugar.
            </p>
          </div>

          <div>
            <label htmlFor="pension-years" className="mb-1 block text-sm font-medium text-gray-700">
              Años de experiencia laboral (estimado)
            </label>
            <input
              id="pension-years"
              type="number"
              min={0}
              max={80}
              value={yearsWorkedEstimate}
              onChange={(e) => setYearsWorkedEstimate(e.target.value)}
              placeholder="Ej. 20"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-40"
            />
            <p className="mt-1 text-xs text-gray-500">
              Úsalo si no sabes tus semanas cotizadas exactas — lo usamos solo para dar un estimado.
            </p>
          </div>

          <div>
            <label htmlFor="pension-income" className="mb-1 block text-sm font-medium text-gray-700">
              Ingreso mensual actual (en tu moneda local)
            </label>
            <input
              id="pension-income"
              type="number"
              min={0}
              value={currentIncome}
              onChange={(e) => setCurrentIncome(e.target.value)}
              placeholder="Ej. 2500000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-64"
            />
          </div>

          <div>
            <label htmlFor="pension-formal" className="mb-1 block text-sm font-medium text-gray-700">
              ¿Cotizas regularmente hoy?
            </label>
            <select
              id="pension-formal"
              value={formalStatus}
              onChange={(e) => setFormalStatus(e.target.value as "unknown" | "formal" | "informal")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-80"
            >
              <option value="unknown">No lo sé</option>
              <option value="formal">Sí — tengo contrato formal o cotizo como independiente (PILA)</option>
              <option value="informal">No — trabajo informal o independiente sin cotizar</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Esto decide si tiene sentido mostrarte "Formalizarte" como palanca — si ya cotizas, no
              te aplica.
            </p>
          </div>

          <div>
            <label htmlFor="pension-regime" className="mb-1 block text-sm font-medium text-gray-700">
              Régimen pensional
            </label>
            <select
              id="pension-regime"
              value={regime}
              onChange={(e) => setRegime(e.target.value as PensionRegime)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-80"
            >
              {REGIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              El <strong>RPM</strong> (Colpensiones) es un fondo público: tu pensión depende de tus
              semanas cotizadas y tu salario base. El <strong>RAIS</strong> (Porvenir, Protección,
              Colfondos u otro fondo privado) es una cuenta de ahorro individual. Para saber en cuál
              estás, revisa el nombre de la entidad en tu desprendible de pago o certificado
              laboral.
              {regime === "unknown" &&
                " Si no lo sabes todavía, no afecta poder ver tu proyección — solo la hace un poco menos precisa."}
            </p>
          </div>

          <div>
            <label htmlFor="pension-voluntary" className="mb-1 block text-sm font-medium text-gray-700">
              Aporte voluntario mensual que podrías hacer (opcional)
            </label>
            <input
              id="pension-voluntary"
              type="number"
              min={0}
              value={voluntaryMonthlyAmount}
              onChange={(e) => setVoluntaryMonthlyAmount(e.target.value)}
              placeholder="Ej. 200000"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none sm:w-64"
            />
            <p className="mt-1 text-xs text-gray-500">
              Si lo dejas vacío, te mostramos el efecto de un aporte voluntario ilustrativo en vez
              de uno calculado sobre un monto real tuyo.
            </p>
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={15} strokeWidth={2.25} />
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Calculando..." : "Calcular mi proyección"}
          </Button>
        </form>
      </Card>

      {result && (
        <>
          <Card>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Wallet size={16} strokeWidth={2} />
              <span>Tu ingreso estimado en la vejez si sigues exactamente como hoy</span>
            </div>
            <p className="text-xs text-gray-500">Línea base, calculada de tus datos actuales</p>
            <div className="my-3 text-3xl font-bold">{formatCurrency(result.projection.baseline.amount)}</div>
            <p className="text-sm text-gray-500">
              Rango estimado: {formatCurrency(result.projection.baseline.low)} —{" "}
              {formatCurrency(result.projection.baseline.high)} mensuales
            </p>
          </Card>

          <div>
            <h2 className="mb-1 font-semibold">Qué pasa si...</h2>
            <p className="mb-3 text-sm text-gray-500">
              Cada palanca, calculada con tus propios datos — no tienes que elegir una para verlas.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {result.projection.scenarios.map((s) => {
                const isRecommended = s.scenario === result.projection.recommendedScenario;
                return (
                  <Card
                    key={s.scenario}
                    className={isRecommended ? "border-2 border-brand-400 bg-brand-50/40" : "border border-gray-200"}
                  >
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{s.label}</span>
                      {isRecommended && (
                        <Badge tone="accent" icon={Sparkles}>Recomendado para ti</Badge>
                      )}
                    </div>
                    <div className="my-2 flex items-center gap-3">
                      <span className="text-2xl font-bold">{formatCurrency(s.amount.amount)}</span>
                      <Badge tone={s.deltaPct >= 0 ? "success" : "neutral"}>
                        {s.deltaPct >= 0 ? "+" : ""}
                        {s.deltaPct}%
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{s.explanation}</p>
                  </Card>
                );
              })}
            </div>
          </div>

          <Card className="border border-brand-100 bg-brand-50">
            <p className="text-sm text-brand-900">
              <strong>Para tu caso:</strong> {result.projection.recommendationRationale}
            </p>
            <p className="mt-2 text-sm text-brand-900">
              Tu proyección es directamente proporcional a tu ingreso: si tu ingreso sube un{" "}
              {result.projection.incomeIncreaseForTenPctGain}%, tu proyección sube ese mismo
              porcentaje — no hace falta duplicar tu ingreso para ver una mejora real.
            </p>
          </Card>

          <p className="rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-500">
            Esta es una estimación educativa, no un cálculo oficial — y cambiar de régimen en
            particular es una decisión real que conviene consultar directamente con Colpensiones o
            tu fondo antes de tomarla. Para tu proyección exacta, consulta el simulador de tu fondo
            de pensiones.
          </p>

        </>
      )}

      <Card>
        <h2 className="mb-1 font-semibold">Aprende a mejorar tu proyección</h2>
        <p className="mb-4 text-sm text-gray-500">
          Contenido corto y práctico sobre pensión y ahorro, pensado para resolver dudas comunes
        </p>
        <div className="space-y-2">
          {FINANCIAL_TOPICS.map((topic) => {
            const isOpen = openTopicId === topic.id;
            return (
              <div key={topic.id} className="rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setOpenTopicId(isOpen ? null : topic.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="font-medium">{topic.title}</span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2.25}
                    className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="space-y-3 border-t border-gray-100 p-4 pt-3">
                    <p className="whitespace-pre-line text-sm text-gray-600">{topic.summary}</p>
                    <Button
                      variant="outline"
                      size="md"
                      icon={MessageCircle}
                      onClick={() => talkToMentor(topic.mentorPrompt)}
                    >
                      Habla con el Mentor sobre esto
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <ModuleStepper current="pension" />
    </div>
  );
}
