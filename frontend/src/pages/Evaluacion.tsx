import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp, CheckCircle2, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge, Button } from "../components/ui";
import { CvDropzone } from "../components/CvDropzone";
import { useAuth } from "../context/AuthContext";
import { CvAnalysisResult } from "../types";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  type: "textarea" | "cv-upload" | "skill-sliders" | "multi-select" | "goal-form";
  placeholder?: string;
  options?: string[];
}

interface AssessmentResult {
  resultSkills: { name: string; level: number }[];
  automationRisk: number;
  adaptationPotential: number;
  recommendedSkills: { name: string; demand: string; growthPct: number }[];
  employabilityScore: number;
  summary: string;
}

const PIE_COLORS = ["#365e8c", "#d7e0ec"];

export function Evaluacion() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<WizardStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [experienceText, setExperienceText] = useState("");
  const [cvResult, setCvResult] = useState<CvAnalysisResult | null>(null);
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [detectedSkills, setDetectedSkills] = useState<Set<string>>(new Set());
  const [detectingSkills, setDetectingSkills] = useState(false);
  const [detectSkillsError, setDetectSkillsError] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    api.get<{ steps: WizardStep[] }>("/assessment/steps").then((data) => {
      setSteps(data.steps);
      const skillsStep = data.steps.find((s) => s.type === "skill-sliders");
      if (skillsStep?.options) {
        const initial: Record<string, number> = {};
        skillsStep.options.forEach((o) => (initial[o] = 40));
        setSkillLevels(initial);
      }
    });
  }, []);

  if (steps.length === 0) return <p className="text-gray-500">Cargando...</p>;

  const step = steps[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  async function detectSkills(): Promise<boolean> {
    setDetectingSkills(true);
    setDetectSkillsError(false);
    try {
      const res = await api.post<{
        skills: { name: string; level: number; detected: boolean }[];
        interestOptions: string[];
      }>("/assessment/detect-skills", {
        experienceText,
        cvExtractedSkills: cvResult?.extractedSkills || [],
        cvAnalysisId: cvResult?.id,
      });
      const levels: Record<string, number> = {};
      const detected = new Set<string>();
      res.skills.forEach((s) => {
        levels[s.name] = s.level;
        if (s.detected) detected.add(s.name);
      });
      setSkillLevels(levels);
      setDetectedSkills(detected);
      setSteps((prev) =>
        prev.map((s) => {
          if (s.type === "skill-sliders") return { ...s, options: res.skills.map((sk) => sk.name) };
          if (s.type === "multi-select" && res.interestOptions?.length) return { ...s, options: res.interestOptions };
          return s;
        })
      );
      return true;
    } catch {
      // The sliders are read-only (values come purely from detection), so unlike a manual-override
      // UI there's no fallback to "let the person adjust it themselves" — surface the failure and
      // require a successful retry before letting them proceed.
      setDetectSkillsError(true);
      return false;
    } finally {
      setDetectingSkills(false);
    }
  }

  async function handleNext() {
    const nextStep = steps[stepIndex + 1];
    if (nextStep?.type === "skill-sliders") {
      const ok = await detectSkills();
      if (!ok) return;
    }
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        experienceText,
        currentSkills: Object.entries(skillLevels).map(([name, level]) => ({ name, level })),
        interests,
        goal,
        weeklyHours,
      };
      const res = await api.post<AssessmentResult>("/assessment", payload);
      setResult(res);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const pieData = [
      { name: "Completado", value: result.employabilityScore },
      { name: "Por mejorar", value: 100 - result.employabilityScore },
    ];
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resultados de tu Evaluación</h1>
          <p className="text-gray-500">{result.summary}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold">Tus Habilidades</h2>
            <div className="space-y-3">
              {result.resultSkills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-gray-500">{s.level}%</span>
                  </div>
                  <ProgressBar value={s.level} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Índice de Empleabilidad</h2>
            <div className="mx-auto h-40 w-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={45} outerRadius={70} startAngle={90} endAngle={-270}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg bg-brand-50 py-2">
                <div className="text-lg font-semibold text-brand-800">{result.employabilityScore}%</div>
                <div className="text-xs text-gray-500">Completado</div>
              </div>
              <div className="rounded-lg bg-brand-50 py-2">
                <div className="text-lg font-semibold text-brand-800">{100 - result.employabilityScore}%</div>
                <div className="text-xs text-gray-500">Por mejorar</div>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Habilidades Recomendadas para Ti</h2>
              <p className="text-sm text-gray-500">Basado en tu experiencia y tendencias del mercado</p>
            </div>
            <Link to="/cursos" className="text-sm font-semibold text-brand-700 hover:underline">
              Ver cursos →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {result.recommendedSkills.map((s) => (
              <Link
                key={s.name}
                to={`/cursos?search=${encodeURIComponent(s.name)}`}
                className="rounded-xl border border-gray-200 p-4 transition hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="font-medium">{s.name}</div>
                <div className="mt-1 flex gap-2">
                  <Badge>{s.demand}</Badge>
                  <Badge tone="success" icon={TrendingUp}>+{s.growthPct}%</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="accent" icon={Sparkles}>Premium</Badge>
                <h2 className="font-semibold">
                  {cvResult ? "Genera tu CV optimizado" : "Sube tu CV para generar una versión optimizada"}
                </h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {cvResult
                  ? "Usa esta evaluación y tu CV para crear un documento ATS, o adaptado a una vacante real específica."
                  : "Ve a Transición para subir tu CV y desbloquear el generador — ya con estas habilidades listas para incluir."}
              </p>
            </div>
            <Button
              variant="secondary"
              icon={FileText}
              onClick={() => navigate("/transicion", cvResult ? { state: { cvResult } } : undefined)}
            >
              {cvResult ? "Generar mi CV" : "Ir a Transición"}
            </Button>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button onClick={() => navigate("/transicion")} icon={ArrowRight} iconPosition="right">
            Ver Mapa de Transición Laboral
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <Badge icon={Sparkles}>Evaluación con IA</Badge>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Descubre tu Potencial</h1>
        <p className="text-gray-500">
          Esta evaluación nos ayuda a personalizar tu experiencia y recomendarte las mejores
          oportunidades
        </p>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-sm text-gray-500">
          <span>
            Paso {stepIndex + 1} de {steps.length}
          </span>
          <span>{progressPct}%</span>
        </div>
        <ProgressBar value={progressPct} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold">{step.title}</h2>
        <p className="mb-4 text-sm text-gray-500">{step.description}</p>

        {step.type === "textarea" && (
          <textarea
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            placeholder={step.placeholder}
            rows={6}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        )}

        {step.type === "cv-upload" && (
          <div>
            <CvDropzone
              onUploaded={setCvResult}
              title=""
              description=""
            />
            <p className="mt-3 text-xs text-gray-500">
              Puedes omitir este paso con "Siguiente" si prefieres no subir tu CV ahora.
            </p>
          </div>
        )}

        {step.type === "skill-sliders" && (
          <div className="space-y-4">
            {detectingSkills && <p className="text-sm text-gray-500">Detectando habilidades de tu experiencia y CV...</p>}
            {detectSkillsError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-1.5 text-sm text-red-700">
                  <AlertCircle size={15} strokeWidth={2.25} />
                  No pudimos detectar tus habilidades. Inténtalo de nuevo.
                </p>
                <Button size="md" variant="outline" icon={RefreshCw} onClick={() => detectSkills()}>
                  Reintentar detección
                </Button>
              </div>
            )}
            <p className="text-xs text-gray-500">
              Estos niveles se detectan automáticamente de tu experiencia y tu CV — no se editan
              manualmente, para que reflejen evidencia real y no una estimación propia. Este es solo
              un primer vistazo: en <Link to="/actualizacion" className="font-medium text-brand-700 hover:underline">Actualización</Link>{" "}
              puedes tomar un cuestionario con preguntas puntuales para una medición más precisa.
            </p>
            {!detectSkillsError &&
              step.options?.map((opt) => (
                <div key={opt}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5">
                      {opt}
                      {detectedSkills.has(opt) && (
                        <span title="Detectado automáticamente">
                          <CheckCircle2 size={13} strokeWidth={2.5} className="text-emerald-600" />
                        </span>
                      )}
                    </span>
                    <span className="text-gray-500">{skillLevels[opt] ?? 40}%</span>
                  </div>
                  <ProgressBar value={skillLevels[opt] ?? 40} />
                </div>
              ))}
          </div>
        )}

        {step.type === "multi-select" && (
          <div className="flex flex-wrap gap-2">
            {step.options?.map((opt) => {
              const selected = interests.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    setInterests(selected ? interests.filter((i) => i !== opt) : [...interests, opt])
                  }
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    selected
                      ? "border-brand-700 bg-brand-700 text-white"
                      : "border-gray-300 text-gray-600 hover:border-brand-300"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {step.type === "goal-form" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="eval-goal" className="mb-1 block text-sm font-medium text-gray-700">
                ¿Qué buscas lograr?
              </label>
              <input
                id="eval-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ej. Cambiar de carrera hacia consultoría digital"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="eval-hours" className="mb-1 block text-sm font-medium text-gray-700">
                Horas semanales disponibles para aprender: {weeklyHours}h
              </label>
              <input
                id="eval-hours"
                type="range"
                min={0}
                max={20}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-brand-700"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <Button
            variant="ghost"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex(stepIndex - 1)}
            icon={ArrowLeft}
            className={stepIndex === 0 ? "invisible" : ""}
          >
            Atrás
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              submitting ||
              detectingSkills ||
              detectSkillsError ||
              (step.type === "textarea" && !experienceText.trim())
            }
            icon={stepIndex === steps.length - 1 ? undefined : ArrowRight}
            iconPosition="right"
          >
            {submitting ? "Analizando..." : stepIndex === steps.length - 1 ? "Finalizar" : "Siguiente"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
