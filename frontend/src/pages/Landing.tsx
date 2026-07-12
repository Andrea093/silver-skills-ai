import { Link, Navigate } from "react-router-dom";
import { Compass, Briefcase, BookOpen, RefreshCw, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Card, Button, IconBadge } from "../components/ui";

const PILLARS = [
  {
    icon: Compass,
    title: "Evaluación de habilidades",
    text: "Cuéntanos tu trayectoria y descubrimos tus fortalezas reales, no un cuestionario genérico.",
  },
  {
    icon: Briefcase,
    title: "Vacantes reales",
    text: "Conectadas al Servicio Público de Empleo, Adzuna, Jooble y Remotive — nunca inventadas.",
  },
  {
    icon: BookOpen,
    title: "Cursos con impacto medible",
    text: "De Coursera, edX, Udemy y LinkedIn Learning, elegidos según lo que realmente te falta.",
  },
  {
    icon: RefreshCw,
    title: "Actualización de habilidades",
    text: "¿Ya tienes empleo? Descubre qué competencias del siglo XXI conviene sumar para seguir vigente.",
  },
];

const STEPS = [
  "Cuenta tu experiencia",
  "Recibe tu evaluación",
  "Descubre vacantes y cursos reales",
  "Actualiza tus habilidades",
];

const TRUST_ITEMS = [
  "Vacantes en tiempo real: Servicio Público de Empleo, Adzuna, Jooble y Remotive",
  "Cursos de proveedores reconocidos: Coursera, edX, Udemy y LinkedIn Learning",
  "Tus datos y tu progreso, siempre bajo tu control",
];

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-base font-bold text-white">
      {n}
    </div>
  );
}

export function Landing() {
  const { user, loading } = useAuth();

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 text-lg font-bold text-white">
              S
            </div>
            <div>
              <div className="font-semibold leading-tight tracking-tight">Silver Skills AI</div>
              <div className="text-sm text-gray-500">Tu futuro profesional</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline">Iniciar sesión</Button>
            </Link>
            <Link to="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Tu experiencia vale. Te ayudamos a llevarla al siguiente empleo.
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Una plataforma pensada para profesionales de 45+ que buscan reinventarse o mantenerse
              vigentes: evaluación de habilidades, vacantes reales y formación con impacto medible.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/register">
                <Button size="lg" icon={ArrowRight} iconPosition="right">
                  Comienza gratis
                </Button>
              </Link>
              <Link to="/login" className="text-base font-semibold text-brand-700 hover:underline">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-card">
            <img
              src="https://images.pexels.com/photos/8424520/pexels-photo-8424520.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Profesional de más de 50 años sonriendo con confianza en su lugar de trabajo"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-8 text-center text-2xl font-bold tracking-tight md:text-3xl">
              Todo lo que necesitas para tu próximo paso profesional
            </h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {PILLARS.map((p) => (
                <Card key={p.title} className="bg-white">
                  <IconBadge icon={p.icon} tone="brand" />
                  <h3 className="mt-4 font-semibold">{p.title}</h3>
                  <p className="mt-1.5 text-sm text-gray-600">{p.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight md:text-3xl">
              Cómo funciona
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              {STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center text-center">
                  <StepNumber n={i + 1} />
                  <p className="mt-3 text-base font-medium text-gray-800">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <Card className="bg-brand-50">
              <div className="flex items-center gap-2 text-brand-800">
                <ShieldCheck size={20} strokeWidth={2.25} />
                <h2 className="font-semibold">Con quién trabajamos</h2>
              </div>
              <ul className="mt-4 space-y-3">
                {TRUST_ITEMS.map((item) => (
                  <li key={item} className="text-base text-gray-700">
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        <section className="bg-brand-800 py-16 text-white md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              Tu próxima oportunidad empieza hoy
            </h2>
            <p className="mt-3 text-lg text-brand-100">
              Regístrate gratis y descubre tu potencial en minutos.
            </p>
            <div className="mt-7">
              <Link to="/register">
                <Button size="lg" variant="secondary" icon={ArrowRight} iconPosition="right">
                  Comienza gratis
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-sm font-bold text-white">
              S
            </div>
            <span className="text-sm font-medium text-gray-700">Silver Skills AI</span>
          </div>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Silver Skills AI</p>
        </div>
      </footer>
    </div>
  );
}
