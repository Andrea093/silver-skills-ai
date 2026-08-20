import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { Button } from "../components/ui";
import { Logo } from "../components/Logo";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos actualizar tu contraseña. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={40} />
          <div>
            <div className="font-semibold">Silver Skills AI</div>
            <div className="text-sm text-gray-500">Tu futuro profesional</div>
          </div>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="flex items-center gap-1.5 text-sm text-red-700">
              <AlertCircle size={15} strokeWidth={2.25} />
              Este enlace no es válido. Solicita uno nuevo.
            </p>
            <Link to="/olvide-password" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Pedir un enlace nuevo
            </Link>
          </div>
        ) : done ? (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-card">
            <h1 className="mb-2 text-xl font-bold tracking-tight">¡Listo!</h1>
            <p className="text-sm text-gray-600">Tu contraseña se actualizó. Te llevamos a iniciar sesión...</p>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">Crea tu nueva contraseña</h1>
            <p className="mb-6 text-sm text-gray-500">Elige una contraseña nueva para tu cuenta.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-password" className="mb-1 block text-sm font-medium text-gray-700">
                  Nueva contraseña
                </label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="reset-password-confirm" className="mb-1 block text-sm font-medium text-gray-700">
                  Confirma la nueva contraseña
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
