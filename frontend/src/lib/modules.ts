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
}

export const MODULES: ModuleDef[] = [
  { key: "evaluacion", to: "/evaluacion", label: "Evaluación", icon: Compass },
  { key: "transicion", to: "/transicion", label: "Transición", icon: TrendingUp },
  { key: "actualizacion", to: "/actualizacion", label: "Actualización", icon: RefreshCw },
  { key: "pension", to: "/pension", label: "Pensión", icon: PiggyBank },
  { key: "bienestar-financiero", to: "/bienestar-financiero", label: "Bienestar Financiero", icon: Wallet },
  { key: "cursos", to: "/cursos", label: "Cursos", icon: BookOpen },
];
