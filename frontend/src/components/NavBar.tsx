import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applyTextScale, getStoredTextScale, nextTextScale, TextScale } from "../lib/textScale";

const NAV_ITEMS = [
  { to: "/", label: "Inicio", icon: "🏠" },
  { to: "/evaluacion", label: "Evaluación", icon: "🧭" },
  { to: "/transicion", label: "Transición", icon: "📈" },
  { to: "/cursos", label: "Cursos", icon: "📖" },
  { to: "/mentor", label: "Mentor IA", icon: "🤖" },
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
      className={`rounded-lg border border-gray-300 px-2.5 py-1.5 font-bold text-gray-600 hover:border-brand-400 hover:text-brand-700 ${SCALE_SIZE[scale]}`}
    >
      A<span className="align-super text-[0.6em]">+</span>
    </button>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-lg font-bold text-white">
            S
          </div>
          <div>
            <div className="font-semibold leading-tight">Silver Skills AI</div>
            <div className="text-sm text-brand-600">Tu futuro profesional</div>
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <span className="mr-1">🛠️</span>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <TextScaleToggle />
          {user && (
            <div className="text-right text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-gray-500">Empleabilidad: {user.employabilityScore}%</div>
            </div>
          )}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            {user ? initials(user.name) : "?"}
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            title="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
