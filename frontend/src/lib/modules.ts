import { Compass, TrendingUp, RefreshCw, PiggyBank, Wallet, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Single source of truth for the module order, used by both NavBar (top navigation) and
// ModuleStepper (the Anterior/Siguiente bar at the bottom of each module page). Having two
// separately-hand-written lists is exactly how they drifted out of sync before — NavBar had Cursos
// last, ModuleStepper had it third, so "Siguiente" pointed somewhere a person wouldn't expect from
// looking at the top nav.
export type ModuleKey = "evaluacion" | "transicion" | "actualizacion" | "pension" | "bienestar-financiero" | "cursos";

export interface ModuleDef {
  key: ModuleKey;
  to: string;
  label: string;
  icon: LucideIcon;
  // Short one-liner used by Dashboard's module cards — kept here instead of duplicated there, so
  // there's one place describing what each module is for.
  description: string;
}

export const MODULES: ModuleDef[] = [
  { key: "evaluacion", to: "/evaluacion", label: "Evaluación", icon: Compass, description: "Descubre tus fortalezas y qué habilidades priorizar." },
  { key: "transicion", to: "/transicion", label: "Transición", icon: TrendingUp, description: "Vacantes reales compatibles con tu perfil." },
  { key: "actualizacion", to: "/actualizacion", label: "Actualización", icon: RefreshCw, description: "Qué actualizar en tu rol y tu especialidad para seguir competitivo." },
  { key: "pension", to: "/pension", label: "Pensión", icon: PiggyBank, description: "Proyecta tu pensión y qué palancas te conviene mover." },
  { key: "bienestar-financiero", to: "/bienestar-financiero", label: "Bienestar Financiero", icon: Wallet, description: "Deudas, ahorro e inversión según tu situación real." },
  { key: "cursos", to: "/cursos", label: "Cursos", icon: BookOpen, description: "Cursos y programas conectados a tus brechas de habilidades." },
];
