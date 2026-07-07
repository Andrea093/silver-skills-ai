import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, TrendingUp, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { Button } from "../components/ui";

const HIGHLIGHTS = [
  { icon: TrendingUp, text: "Vacantes reales compatibles con tu experiencia" },
  { icon: BookOpen, text: "Rutas de formación con cursos de instituciones reconocidas" },
  { icon: ShieldCheck, text: "Tus datos y tu progreso, siempre bajo tu control" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("maria.gonzalez@example.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-brand-900 px-12 py-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-lg font-bold">S</div>
          <div>
            <div className="font-semibold tracking-tight">Silver Skills AI</div>
            <div className="text-sm text-brand-200">Tu futuro profesional</div>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="mb-4 text-3xl font-bold leading-tight">
            Tu experiencia vale. Te ayudamos a llevarla al siguiente empleo.
          </h1>
          <p className="text-brand-200">
            Una plataforma pensada para profesionales de 45+ que buscan reinventarse: evaluación de
            habilidades, vacantes reales y formación con impacto medible.
          </p>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-start gap-3 text-sm text-brand-100">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <h.icon size={15} strokeWidth={2.25} />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-brand-300">© {new Date().getFullYear()} Silver Skills AI</p>
      </div>

      <div className="flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-800 font-bold text-white">
              S
            </div>
            <div>
              <div className="font-semibold">Silver Skills AI</div>
              <div className="text-sm text-gray-500">Tu futuro profesional</div>
            </div>
          </div>

          <h1 className="mb-1 text-2xl font-bold tracking-tight">Inicia sesión</h1>
          <p className="mb-6 text-sm text-gray-500">Usa la cuenta demo precargada o crea la tuya.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-gray-700">
                Correo
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
