import { FormEvent, useEffect, useRef, useState } from "react";
import { Bot, X, TrendingUp, Target, BookOpen, Lightbulb, Send, ExternalLink } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { api } from "../lib/api";
import { Badge } from "../components/ui";
import { ChatMessage, MentorCard } from "../types";
import { useAuth } from "../context/AuthContext";
import { useMentor } from "../context/MentorContext";

const SUGGESTIONS = [
  "¿Qué habilidad debería aprender primero?",
  "Muéstrame mi plan de desarrollo",
  "¿Cómo mejoro mi empleabilidad?",
  "Recomiéndame cursos para esta semana",
];

const QUICK_ACTIONS: { icon: LucideIcon; title: string; message: string }[] = [
  { icon: TrendingUp, title: "Analizar mi progreso", message: "Analiza mi progreso de aprendizaje" },
  { icon: Target, title: "Definir nuevas metas", message: "Ayúdame a definir nuevas metas de desarrollo profesional" },
  { icon: BookOpen, title: "Recomendar cursos", message: "Recomiéndame cursos basados en mi perfil" },
  { icon: Lightbulb, title: "Consejos de carrera", message: "Dame consejos de carrera personalizados" },
];

function JobCards({ data }: { data: any }) {
  return (
    <div className="mt-3 space-y-2">
      {(data.jobs || []).slice(0, 3).map((job: any) => (
        <a
          key={`${job.source}:${job.externalId}`}
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-2.5 text-xs hover:border-brand-300"
        >
          <div className="font-medium">{job.title}</div>
          <div className="text-gray-500">
            {job.company} · {job.location}
          </div>
          {job.ageFriendly && <Badge tone="success">✓ Empleador inclusivo 45+</Badge>}
        </a>
      ))}
      {(data.portalLinks || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {data.portalLinks.map((l: any) => (
            <a
              key={l.portal}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-[11px] font-medium text-gray-600 hover:border-brand-400"
            >
              {l.portal}
              <ExternalLink size={10} strokeWidth={2.25} />
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
      {(data.courses || []).slice(0, 3).map((course: any, i: number) => (
        <a
          key={course.id || i}
          href={course.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-gray-200 p-2.5 text-xs hover:border-brand-300"
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

export function MentorWidget() {
  const { user } = useAuth();
  const { isOpen, prefillMessage, openMentor, closeMentor, clearPrefill } = useMentor();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !historyLoaded) {
      api
        .get<ChatMessage[]>("/mentor/history")
        .then(setMessages)
        .finally(() => setHistoryLoaded(true));
    }
  }, [isOpen, historyLoaded]);

  useEffect(() => {
    if (isOpen && prefillMessage) {
      sendMessage(prefillMessage);
      clearPrefill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, prefillMessage]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    setSending(true);
    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, cards: [], createdAt: new Date().toISOString() },
    ]);
    try {
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

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => openMentor()}
        aria-label="Abrir Mentor IA"
        title="Mentor IA"
        className="group fixed bottom-6 right-6 z-50 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-xl ring-4 ring-brand-700/20 transition-transform hover:scale-110 hover:shadow-2xl"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand-600/40 [animation-duration:2.5s]" />
        <Bot size={40} strokeWidth={2} className="transition-transform group-hover:-rotate-6" />
        <span className="absolute -top-1 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100vh-40px))] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-brand-700 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
            <Bot size={22} strokeWidth={2.25} />
          </div>
          <div>
            <div className="text-base font-semibold">Mentor IA</div>
            <div className="text-xs text-brand-100">Siempre disponible para ayudarte</div>
          </div>
        </div>
        <button
          type="button"
          onClick={closeMentor}
          aria-label="Cerrar Mentor IA"
          className="rounded-lg p-1 text-brand-100 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={18} strokeWidth={2.25} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <div className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
            ¡Hola{user ? ` ${user.name.split(" ")[0]}` : ""}! Soy tu mentor virtual con IA. ¿En qué
            puedo ayudarte hoy?
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm ${
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
        <div className="border-t border-gray-100 p-3">
          <div className="mb-2 grid grid-cols-2 gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.title}
                type="button"
                onClick={() => sendMessage(a.message)}
                className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1.5 text-left text-[11px] font-medium text-brand-800 transition-colors hover:bg-brand-100"
              >
                <a.icon size={13} strokeWidth={2.25} className="shrink-0" />
                {a.title}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendMessage(s)}
                className="rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
          aria-label="Escribe tu pregunta o mensaje"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={sending}
          aria-label="Enviar mensaje"
          className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-3.5 py-2 text-white shadow-sm transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} strokeWidth={2.25} />
        </button>
      </form>
    </div>
  );
}
