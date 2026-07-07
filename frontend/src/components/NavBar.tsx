import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Home, Compass, TrendingUp, BookOpen, Sparkles, ShieldCheck, LogOut, Type } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { applyTextScale, getStoredTextScale, nextTextScale, TextScale } from "../lib/textScale";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/evaluacion", label: "Evaluación", icon: Compass },
  { to: "/transicion", label: "Transición", icon: TrendingUp },
  { to: "/cursos", label: "Cursos", icon: BookOpen },
  { to: "/mentor", label: "Mentor IA", icon: Sparkles },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const SCALE_SIZE: Record<TextScale, string> = { normal: "text-sm", lg: "text-base", xl: "text-lg" };

function TextScaleToggle() {
  const [scale, setScale] = useState<TextScale>(getStoredTextScale());

  function handleClick() {
    const next = nextTextScale(scale);
    applyTextScale(next);
    setScale(next);
  }

  const nextLabel =
    scale === "normal" ? "Aumentar tamaño de texto" : scale === "lg" ? "Aumentar aún más" : "Volver a tamaño normal";

  return (
    <button
      type="button"
      onClick={handleClick}
      title={nextLabel}
      aria-label={nextLabel}
      className={`inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 font-semibold text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-700 ${SCALE_SIZE[scale]}`}
    >
      <Type size={15} strokeWidth={2.25} />
      A<span className="align-super text-[0.6em]">+</span>
    </button>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
      isActive ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
    }`;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-lg font-bold text-white">
            S
          </div>
          <div>
            <div className="font-semibold leading-tight tracking-tight">Silver Skills AI</div>
            <div className="text-sm text-gray-500">Tu futuro profesional</div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className={linkClass}>
              <item.icon size={16} strokeWidth={2.25} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck size={16} strokeWidth={2.25} />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <TextScaleToggle />
          {user && (
            <div className="text-right text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-500">
                {user.hasProfile ? `Empleabilidad: ${user.employabilityScore}%` : "Sin evaluar"}
              </div>
            </div>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user ? initials(user.name) : "?"}
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            title="Cerrar sesión"
          >
            <LogOut size={16} strokeWidth={2.25} />
          </button>
        </div>
      </div>
    </header>
  );
}
