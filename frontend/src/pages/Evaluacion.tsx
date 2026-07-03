import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge } from "../components/ui";
import { useAuth } from "../context/AuthContext";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  type: "textarea" | "skill-sliders" | "multi-select" | "goal-form";
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

const PIE_COLORS = ["#2563eb", "#dbeafe"];

export function Evaluacion() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [steps, setSteps] = useState<WizardStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [experienceText, setExperienceText] = useState("");
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
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
        skillsStep.options.forEach((o) => (initial[o] = 50));
        setSkillLevels(initial);
      }
    });
  }, []);

  if (steps.length === 0) return <p className="text-gray-500">Cargando...</p>;

  const step = steps[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  async function handleNext() {
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
          <h1 className="text-2xl font-semibold">Resultados de tu Evaluación</h1>
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
                <div className="text-lg font-semibold text-brand-700">{result.employabilityScore}%</div>
                <div className="text-xs text-gray-500">Completado</div>
              </div>
              <div className="rounded-lg bg-brand-50 py-2">
                <div className="text-lg font-semibold text-brand-700">{100 - result.employabilityScore}%</div>
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
            <Link to="/cursos" className="text-sm font-medium text-brand-600 hover:underline">
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
                  <Badge tone="green">+{s.growthPct}%</Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/transicion")}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ver Mapa de Transición Laboral →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <Badge>✨ Evaluación con IA</Badge>
        <h1 className="mt-2 text-2xl font-semibold">Descubre tu Potencial</h1>
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

        {step.type === "skill-sliders" && (
          <div className="space-y-4">
            {step.options?.map((opt) => (
              <div key={opt}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{opt}</span>
                  <span className="text-gray-500">{skillLevels[opt] ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={skillLevels[opt] ?? 50}
                  onChange={(e) => setSkillLevels({ ...skillLevels, [opt]: Number(e.target.value) })}
                  className="w-full accent-brand-600"
                />
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
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
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
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ¿Qué buscas lograr?
              </label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ej. Cambiar de carrera hacia consultoría digital"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Horas semanales disponibles para aprender: {weeklyHours}h
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                className="w-full accent-brand-600"
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            disabled={stepIndex === 0}
            onClick={() => setStepIndex(stepIndex - 1)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 disabled:opacity-0"
          >
            ← Atrás
          </button>
          <button
            onClick={handleNext}
            disabled={submitting || (step.type === "textarea" && !experienceText.trim())}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Analizando..." : stepIndex === steps.length - 1 ? "Finalizar" : "Siguiente →"}
          </button>
        </div>
      </Card>
    </div>
  );
}
