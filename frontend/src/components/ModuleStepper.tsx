import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Compass, TrendingUp, BookOpen, PiggyBank, Wallet, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// A fixed, suggested order through the modules — not enforced, just a visible "you are here, this
// is what's next" so navigating the platform doesn't require guessing which nav item to click next.
export type ModuleKey = "evaluacion" | "transicion" | "cursos" | "pension" | "bienestar-financiero" | "actualizacion";

interface ModuleDef {
  key: ModuleKey;
  to: string;
  label: string;
  icon: LucideIcon;
}

const SEQUENCE: ModuleDef[] = [
  { key: "evaluacion", to: "/evaluacion", label: "Evaluación", icon: Compass },
  { key: "transicion", to: "/transicion", label: "Transición", icon: TrendingUp },
  { key: "cursos", to: "/cursos", label: "Cursos", icon: BookOpen },
  { key: "pension", to: "/pension", label: "Pensión", icon: PiggyBank },
  { key: "bienestar-financiero", to: "/bienestar-financiero", label: "Bienestar Financiero", icon: Wallet },
  { key: "actualizacion", to: "/actualizacion", label: "Actualización", icon: RefreshCw },
];

export function ModuleStepper({ current }: { current: ModuleKey }) {
  const index = SEQUENCE.findIndex((m) => m.key === current);
  const prev = index > 0 ? SEQUENCE[index - 1] : null;
  const next = index >= 0 && index < SEQUENCE.length - 1 ? SEQUENCE[index + 1] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {SEQUENCE.map((m, i) => {
          const isCurrent = m.key === current;
          return (
            <Link
              key={m.key}
              to={m.to}
              title={m.label}
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                isCurrent
                  ? "border-brand-700 bg-brand-700 text-white"
                  : i < index
                  ? "border-brand-200 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-400 hover:border-brand-300"
              }`}
            >
              <m.icon size={14} strokeWidth={2.25} />
            </Link>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {prev ? (
          <Link
            to={prev.to}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-brand-700"
          >
            <ArrowLeft size={15} strokeWidth={2.25} />
            {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={next.to}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Siguiente: {next.label}
            <ArrowRight size={15} strokeWidth={2.25} />
          </Link>
        ) : (
          <span className="text-sm font-medium text-emerald-700">¡Completaste el recorrido!</span>
        )}
      </div>
    </div>
  );
}
