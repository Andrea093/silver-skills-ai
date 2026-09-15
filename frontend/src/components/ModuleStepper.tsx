import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MODULES, ModuleKey } from "../lib/modules";

export type { ModuleKey };

// Just Anterior/Siguiente — an earlier version also drew a row of module icons above this, but
// that duplicated the top NavBar (same modules, same order, right above it) without adding
// anything a person couldn't already do from there, so it just read as visual clutter/redundant
// navigation.
export function ModuleStepper({ current }: { current: ModuleKey }) {
  const index = MODULES.findIndex((m) => m.key === current);
  const prev = index > 0 ? MODULES[index - 1] : null;
  const next = index >= 0 && index < MODULES.length - 1 ? MODULES[index + 1] : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4">
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
  );
}
