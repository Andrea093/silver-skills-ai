import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, TrendingUp, Target, BookOpen, Lightbulb, Send, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../lib/api";
import { Card, IconBadge } from "../components/ui";
import { ChatMessage, MentorCard } from "../types";
import { useAuth } from "../context/AuthContext";

const SUGGESTIONS = [
  "¿Qué habilidad debería aprender primero?",
  "Muéstrame mi plan de desarrollo",
  "¿Cómo mejoro mi empleabilidad?",
  "Recomiéndame cursos para esta semana",
];

const QUICK_ACTIONS: { icon: LucideIcon; title: string; subtitle: string; message: string }[] = [
  { icon: TrendingUp, title: "Analizar mi progreso", subtitle: "Ver estadísticas de aprendizaje", message: "Analiza mi progreso de aprendizaje" },
  { icon: Target, title: "Definir nuevas metas", subtitle: "Establecer objetivos claros", message: "Ayúdame a definir nuevas metas de desarrollo profesional" },
  { icon: BookOpen, title: "Recomendar cursos", subtitle: "Basado en mi perfil", message: "Recomiéndame cursos basados en mi perfil" },
  { icon: Lightbulb, title: "Consejos de carrera", subtitle: "Orientación personalizada", message: "Dame consejos de carrera personalizados" },
];

const INSIGHTS: { icon: LucideIcon; title: string; subtitle: string; to: string }[] = [
  { icon: Sparkles, title: "Explora IA Generativa", subtitle: "Cursos reales para subir tu empleabilidad", to: "/cursos?search=IA Generativa" },
  { icon: Target, title: "Oportunidades detectadas", subtitle: "Revisa vacantes reales compatibles con tu perfil", to: "/transicion" },
  { icon: TrendingUp, title: "Habilidad en demanda", subtitle: "Marketing Digital crece fuerte en LATAM", to: "/cursos?search=Marketing Digital" },
];

function JobCards({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {(data.jobs || []).slice(0, 4).map((job: any) => (
        <a
          key={`${job.source}:${job.externalId}`}
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-3 text-sm hover:border-brand-300"
        >
          <div className="font-medium">{job.title}</div>
          <div className="text-gray-500">
            {job.company} · {job.location}
          </div>
        </a>
      ))}
      {(data.portalLinks || []).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.portalLinks.map((l: any) => (
            <a
              key={l.portal}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:border-brand-400"
            >
              {l.portal}
              <ExternalLink size={11} strokeWidth={2.25} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseCards({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {(data.courses || []).slice(0, 4).map((course: any, i: number) => (
        <a
          key={course.id || i}
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-3 text-sm hover:border-brand-300"
        >
          <div className="font-medium">{course.title}</div>
          <div className="text-gray-500">
            {course.provider} {course.priceLabel ? `· ${course.priceLabel}` : ""}
          </div>
        </a>
      ))}
    </div>
  );
}

function CardsRenderer({ cards }: { cards: MentorCard[] }) {
  return (
    <>
      {cards.map((c, i) =>
        c.type === "job" ? <JobCards key={i} data={c.data} /> : <CourseCards key={i} data={c.data} />
      )}
    </>
  );
}

export function Mentor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get<{ agentEnabled: boolean }>("/mentor/status").then((s) => setAgentEnabled(s.agentEnabled));
    api.get<ChatMessage[]>("/mentor/history").then(setMessages);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, cards: [], createdAt: new Date().toISOString() },
    ]);
    try {
      // POST /mentor/chat responds with {id, message, cards, createdAt} — not the same shape as
      // the ChatMessage rows returned by GET /mentor/history (which have role/content). Map it
      // explicitly instead of trusting the generic type param, or the bubble renders with no text.
      const res = await api.post<{ id: string; message: string; cards: ChatMessage["cards"]; createdAt: string }>(
        "/mentor/chat",
        { message: text }
      );
      setMessages((prev) => [
        ...prev,
        { id: res.id, role: "assistant", content: res.message, cards: res.cards, createdAt: res.createdAt },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold tracking-tight">Mentor Virtual con IA</h1>
        <p className="mb-4 text-gray-500">Tu asistente personal para guiar tu aprendizaje y desarrollo profesional</p>
        {!agentEnabled && (
          <p className="mb-4 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
            Modo asistido (sin ANTHROPIC_API_KEY configurada): las respuestas usan reglas simples, pero las
            vacantes y cursos que muestra son siempre reales.
          </p>
        )}

        <Card className="flex h-[600px] flex-col">
          <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-3">
            <IconBadge icon={Sparkles} size={36} />
            <div>
              <div className="font-medium">Mentor IA</div>
              <div className="text-xs text-gray-500">Siempre disponible para ayudarte</div>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-900">
                ¡Hola {user?.name.split(" ")[0]}! Soy tu mentor virtual con IA. Estoy aquí para guiarte en tu camino de
                aprendizaje y desarrollo profesional. ¿En qué puedo ayudarte hoy?
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    m.role === "user" ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.cards?.length > 0 && <CardsRenderer cards={m.cards} />}
                </div>
              </div>
            ))}
            {sending && <p className="text-xs text-gray-500">Mentor IA está escribiendo...</p>}
            <div ref={bottomRef} />
          </div>

          {messages.length === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => sendMessage(s)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 pt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta o mensaje..."
              aria-label="Escribe tu pregunta o mensaje"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={sending}
              aria-label="Enviar mensaje"
              className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2 text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={16} strokeWidth={2.25} />
            </button>
          </form>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-semibold">Acciones Rápidas</h2>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.title}
                type="button"
                onClick={() => sendMessage(a.message)}
                className="flex w-full items-center gap-3 rounded-lg bg-brand-50 p-3 text-left transition-colors hover:bg-brand-100"
              >
                <a.icon size={17} strokeWidth={2} className="shrink-0 text-brand-700" />
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="text-xs text-gray-500">{a.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Insights Personalizados</h2>
          <div className="space-y-2">
            {INSIGHTS.map((insight) => (
              <button
                key={insight.title}
                type="button"
                onClick={() => navigate(insight.to)}
                className="block w-full rounded-lg bg-brand-50 p-3 text-left transition-colors hover:bg-brand-100"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <insight.icon size={16} strokeWidth={2} className="shrink-0 text-brand-700" />
                  {insight.title}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">{insight.subtitle}</div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
