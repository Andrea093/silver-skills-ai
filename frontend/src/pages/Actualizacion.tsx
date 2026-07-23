import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, CheckCircle2, ExternalLink, BookMarked, ClipboardList } from "lucide-react";
import { api } from "../lib/api";
import { Card, Badge, Button } from "../components/ui";

interface SkillResource {
  title: string;
  provider: string;
  url: string;
  isFree: boolean | null;
  priceLabel: string;
  tags: string[];
  isSearchLink?: boolean;
}

interface SkillGap {
  skill: string;
  resource: SkillResource | null;
}

interface SkillsUpdateData {
  hasProfile: boolean;
  professionId?: string;
  professionLabel?: string;
  owned?: string[];
  gaps?: SkillGap[];
  totalGapsCount?: number;
  specialtyId?: string | null;
  specialtyLabel?: string | null;
  disciplinaryOwned?: string[] | null;
  disciplinaryGaps?: SkillGap[] | null;
  disciplinaryTotalGapsCount?: number | null;
}

interface QuizQuestionDTO {
  skill: string;
  question: string;
  options: string[];
}

interface QuizData {
  professionLabel: string;
  behaviorQuestions: QuizQuestionDTO[];
  specialtyLabel: string | null;
  knowledgeQuestions: QuizQuestionDTO[];
}

function OwnedSkillsCard({ title, owned, emptyText }: { title: string; owned: string[] | undefined | null; emptyText: string }) {
  return (
    <Card>
      <h2 className="mb-4 font-semibold">{title}</h2>
      {!owned || owned.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {owned.map((name) => (
            <Badge key={name} tone="success" icon={CheckCircle2}>
              {name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
}

function GapsCard({
  title,
  description,
  gaps,
  totalGapsCount,
  emptyText,
}: {
  title: string;
  description: string;
  gaps: SkillGap[] | undefined | null;
  totalGapsCount: number | undefined | null;
  emptyText: string;
}) {
  return (
    <Card>
      <h2 className="mb-1 font-semibold">{title}</h2>
      <p className="mb-4 text-sm text-gray-500">{description}</p>
      {!gaps || gaps.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="space-y-4">
          {gaps.map(({ skill, resource }) => (
            <div key={skill} className="rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <Badge tone="accent">Por actualizar</Badge>
                  <div className="mt-1 font-medium">{skill}</div>
                  {resource && <div className="mt-1 text-sm text-gray-500">{resource.provider}</div>}
                </div>
                {resource && (
                  <div className="text-right">
                    <div className={`font-semibold ${resource.isFree ? "text-emerald-600" : "text-gray-800"}`}>
                      {resource.isFree ? "Gratis" : resource.priceLabel}
                    </div>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                      <Button size="md" icon={ExternalLink} iconPosition="right">
                        {resource.isSearchLink ? "Buscar" : "Comenzar ahora"}
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {totalGapsCount && gaps && totalGapsCount > gaps.length && (
            <p className="text-sm text-gray-500">+{totalGapsCount - gaps.length} habilidades más para actualizar.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function QuizForm({
  questions,
  onSubmit,
  submitting,
}: {
  questions: QuizQuestionDTO[];
  onSubmit: (answers: { skill: string; selectedIndex: number }[]) => void;
  submitting: boolean;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const allAnswered = questions.length > 0 && questions.every((q) => selected[q.skill] !== undefined);

  return (
    <div className="space-y-5">
      {questions.map((q) => (
        <div key={q.skill}>
          <p className="mb-2 text-sm font-medium text-gray-800">{q.question}</p>
          <div className="space-y-1.5">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-2.5 text-sm text-gray-700 hover:border-brand-300"
              >
                <input
                  type="radio"
                  name={q.skill}
                  checked={selected[q.skill] === i}
                  onChange={() => setSelected((prev) => ({ ...prev, [q.skill]: i }))}
                  className="mt-0.5 accent-brand-700"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <Button
        disabled={!allAnswered || submitting}
        onClick={() => onSubmit(questions.map((q) => ({ skill: q.skill, selectedIndex: selected[q.skill] })))}
      >
        {submitting ? "Guardando..." : "Enviar respuestas"}
      </Button>
    </div>
  );
}

export function Actualizacion() {
  const [data, setData] = useState<SkillsUpdateData | null>(null);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [showGeneralQuiz, setShowGeneralQuiz] = useState(false);
  const [showDisciplinaryQuiz, setShowDisciplinaryQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  function loadData() {
    api.get<SkillsUpdateData>("/skills-update").then(setData);
  }

  useEffect(() => {
    loadData();
    api.get<QuizData>("/skills-quiz").then(setQuiz);
  }, []);

  async function handleQuizSubmit(dimension: "general" | "disciplinary", answers: { skill: string; selectedIndex: number }[]) {
    setSubmittingQuiz(true);
    try {
      await api.post("/skills-quiz/submit", { dimension, answers });
      loadData();
      if (dimension === "general") setShowGeneralQuiz(false);
      else setShowDisciplinaryQuiz(false);
    } finally {
      setSubmittingQuiz(false);
    }
  }

  if (!data) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actualización de Habilidades</h1>
        <p className="text-gray-500">
          Para quienes ya tienen empleo: descubre qué debes actualizar en cómo haces tu trabajo y en
          lo que sabes de tu especialidad, para seguir siendo competitivo.
        </p>
      </div>

      {!data.hasProfile && (
        <Card className="border border-accent-200 bg-accent-50">
          <p className="text-sm text-accent-700">
            Para ver qué habilidades actualizar en tu profesión, primero necesitamos conocer tu
            perfil. <Link to="/evaluacion" className="font-semibold underline">Completa la evaluación</Link>{" "}
            o sube tu CV en <Link to="/transicion" className="font-semibold underline">Transición</Link>.
          </p>
        </Card>
      )}

      {data.hasProfile && (
        <>
          <Card>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} strokeWidth={2} className="text-brand-700" />
              <span className="text-sm font-medium text-gray-500">Perfil detectado</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="brand">{data.professionLabel}</Badge>
              {data.specialtyLabel && <Badge tone="accent">{data.specialtyLabel}</Badge>}
            </div>
            {data.professionId === "general" && (
              <p className="mt-3 text-sm text-gray-500">
                Sube tu CV en <Link to="/transicion" className="font-medium text-brand-700 hover:underline">Transición</Link>{" "}
                para una detección de profesión más precisa.
              </p>
            )}
          </Card>

          <div>
            <h2 className="mb-1 flex items-center gap-1.5 text-lg font-semibold">
              <RefreshCw size={17} strokeWidth={2.25} className="text-brand-700" />
              Dimensión 1: Cómo haces tu trabajo
            </h2>
            <p className="mb-3 text-sm text-gray-500">
              Habilidades generales de tu profesión — comunes a cualquier persona en tu rol, más allá
              de tu especialidad específica.
            </p>
            <div className="space-y-4">
              <OwnedSkillsCard
                title="Ya dominas"
                owned={data.owned}
                emptyText="Aún no tienes ninguna de las habilidades clave de tu profesión registradas."
              />
              <GapsCard
                title="Para actualizar"
                description="Recomendadas según tu profesión y las tendencias de habilidades del siglo XXI."
                gaps={data.gaps}
                totalGapsCount={data.totalGapsCount}
                emptyText="¡Ya cubres todas las habilidades clave que identificamos para tu profesión!"
              />
              {quiz && quiz.behaviorQuestions.length > 0 && (
                <Card className="border border-brand-100 bg-brand-50/60">
                  <div className="mb-1 flex items-center gap-2 text-brand-900">
                    <ClipboardList size={17} strokeWidth={2.25} />
                    <h3 className="font-semibold">Mide tu nivel con preguntas reales</h3>
                  </div>
                  <p className="mb-3 text-sm text-brand-900">
                    Un párrafo de texto no puede medir con precisión tus habilidades. Responde estas
                    preguntas puntuales para reemplazar la estimación por evidencia real.
                  </p>
                  {!showGeneralQuiz ? (
                    <Button variant="outline" onClick={() => setShowGeneralQuiz(true)}>
                      Tomar cuestionario
                    </Button>
                  ) : (
                    <QuizForm
                      questions={quiz.behaviorQuestions}
                      submitting={submittingQuiz}
                      onSubmit={(answers) => handleQuizSubmit("general", answers)}
                    />
                  )}
                </Card>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-1 flex items-center gap-1.5 text-lg font-semibold">
              <BookMarked size={17} strokeWidth={2.25} className="text-brand-700" />
              Dimensión 2: Lo que sabes de tu especialidad
            </h2>
            <p className="mb-3 text-sm text-gray-500">
              Conocimiento disciplinar específico — por ejemplo, si tu especialidad es Física, esto
              evalúa Física en sí, no cómo enseñas o gestionas tu rol en general.
            </p>
            {data.specialtyLabel ? (
              <div className="space-y-4">
                <OwnedSkillsCard
                  title="Ya dominas"
                  owned={data.disciplinaryOwned}
                  emptyText="Aún no tienes ninguna de las habilidades disciplinares detectadas registradas."
                />
                <GapsCard
                  title="Para actualizar"
                  description={`Recomendadas según tu especialidad en ${data.specialtyLabel}.`}
                  gaps={data.disciplinaryGaps}
                  totalGapsCount={data.disciplinaryTotalGapsCount}
                  emptyText="¡Ya cubres todo el conocimiento disciplinar que identificamos para tu especialidad!"
                />
                {quiz && quiz.knowledgeQuestions.length > 0 && (
                  <Card className="border border-brand-100 bg-brand-50/60">
                    <div className="mb-1 flex items-center gap-2 text-brand-900">
                      <ClipboardList size={17} strokeWidth={2.25} />
                      <h3 className="font-semibold">Pon a prueba tu conocimiento de {data.specialtyLabel}</h3>
                    </div>
                    <p className="mb-3 text-sm text-brand-900">
                      A diferencia de la dimensión anterior, aquí no se trata de autoevaluarte — son
                      preguntas de conocimiento real, para saber con certeza qué debes actualizar.
                    </p>
                    {!showDisciplinaryQuiz ? (
                      <Button variant="outline" onClick={() => setShowDisciplinaryQuiz(true)}>
                        Tomar cuestionario
                      </Button>
                    ) : (
                      <QuizForm
                        questions={quiz.knowledgeQuestions}
                        submitting={submittingQuiz}
                        onSubmit={(answers) => handleQuizSubmit("disciplinary", answers)}
                      />
                    )}
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border border-accent-200 bg-accent-50">
                <p className="text-sm text-accent-700">
                  No pudimos detectar una especialidad específica dentro de tu profesión. Sube un CV
                  más detallado en <Link to="/transicion" className="font-semibold underline">Transición</Link>{" "}
                  (mencionando tu área o materia específica) para ver esta dimensión.
                </p>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
