import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ArrowLeft, ArrowRight, Sparkles, TrendingUp, FileText, RefreshCw, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge, Button } from "../components/ui";
import { CvDropzone } from "../components/CvDropzone";
import { QuizForm, QuizQuestionDTO } from "../components/QuizForm";
import { useAuth } from "../context/AuthContext";
import { CvAnalysisResult } from "../types";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  type: "textarea" | "cv-upload" | "quiz" | "multi-select" | "goal-form";
  placeholder?: string;
  options?: string[];
}

interface QuizAnswer {
  skill: string;
  selectedIndex: number;
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
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionDTO[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [cvSkillNames, setCvSkillNames] = useState<string[]>([]);
  const [professionLabel, setProfessionLabel] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizLoadError, setQuizLoadError] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [weeklyHours, setWeeklyHours] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  useEffect(() => {
    api.get<{ steps: WizardStep[] }>("/assessment/steps").then((data) => setSteps(data.steps));
  }, []);

  if (steps.length === 0) return <p className="text-gray-500">Cargando...</p>;

  const step = steps[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / steps.length) * 100);

  async function fetchQuizQuestions() {
    setLoadingQuiz(true);
    setQuizLoadError(false);
    try {
      const res = await api.post<{
        professionLabel: string;
        interestOptions: string[];
        behaviorQuestions: QuizQuestionDTO[];
        cvSkillNames: string[];
      }>("/assessment/detect-skills", {
        experienceText,
        cvExtractedSkills: cvResult?.extractedSkills || [],
      });
      setQuizQuestions(res.behaviorQuestions);
      setCvSkillNames(res.cvSkillNames);
      setProfessionLabel(res.professionLabel);
      setSteps((prev) =>
        prev.map((s) =>
          s.type === "multi-select" && res.interestOptions?.length ? { ...s, options: res.interestOptions } : s
        )
      );
    } catch {
      setQuizLoadError(true);
    } finally {
      setLoadingQuiz(false);
    }
  }

  async function proceedFromStep(answers: QuizAnswer[] = quizAnswers) {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }
    setSubmitting(true);
    try {
      const payload = { experienceText, quizAnswers: answers, interests, goal, weeklyHours };
      const res = await api.post<AssessmentResult>("/assessment", payload);
      setResult(res);
      await refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    const nextStep = steps[stepIndex + 1];
    if (nextStep?.type === "quiz" && quizQuestions.length === 0) {
      await fetchQuizQuestions();
    }
    await proceedFromStep();
  }

  function handleQuizComplete(answers: QuizAnswer[]) {
    setQuizAnswers(answers);
    proceedFromStep(answers);
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

        {step.type === "quiz" && (
          <div className="space-y-4">
            {loadingQuiz && <p className="text-sm text-gray-500">Preparando tus preguntas...</p>}
            {quizLoadError && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="flex items-center gap-1.5 text-sm text-red-700">
                  <AlertCircle size={15} strokeWidth={2.25} />
                  No pudimos preparar tus preguntas. Inténtalo de nuevo.
                </p>
                <Button size="md" variant="outline" icon={RefreshCw} onClick={() => fetchQuizQuestions()}>
                  Reintentar
                </Button>
              </div>
            )}
            {!loadingQuiz && !quizLoadError && quizQuestions.length > 0 && (
              <>
                <p className="text-xs text-gray-500">
                  Preguntas puntuales sobre cómo trabajas en la práctica — no una estimación a partir
                  de tu texto ni una autoevaluación libre. Incluyen habilidades del siglo XXI
                  (universales) y algunas específicas de tu perfil detectado
                  {professionLabel ? ` (${professionLabel})` : ""}.
                </p>
                {cvSkillNames.length > 0 && (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="mb-1.5 text-xs font-medium text-gray-500">
                      También vimos esto mencionado en tu CV (sin medir aún):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cvSkillNames.map((name) => (
                        <Badge key={name}>{name}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <QuizForm
                  questions={quizQuestions}
                  submitting={submitting}
                  submitLabel="Guardar y continuar"
                  onSubmit={handleQuizComplete}
                />
              </>
            )}
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
          {step.type !== "quiz" && (
            <Button
              onClick={handleNext}
              disabled={
                submitting || loadingQuiz || (step.type === "textarea" && !experienceText.trim())
              }
              icon={stepIndex === steps.length - 1 ? undefined : ArrowRight}
              iconPosition="right"
            >
              {submitting ? "Analizando..." : stepIndex === steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
