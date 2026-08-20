import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { Button } from "../components/ui";
import { Logo } from "../components/Logo";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos procesar tu solicitud. Intenta de nuevo.");
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

        {sent ? (
          <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-card">
            <h1 className="mb-2 text-xl font-bold tracking-tight">Revisa tu correo</h1>
            <p className="text-sm text-gray-600">
              Si <strong>{email}</strong> tiene una cuenta con nosotros, te enviamos un enlace para
              crear una nueva contraseña. Puede tardar unos minutos — revisa también la carpeta de
              spam.
            </p>
            <Link
              to="/login"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              <ArrowLeft size={15} strokeWidth={2.25} />
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
            <p className="mb-6 text-sm text-gray-500">
              Escribe el correo con el que te registraste y te enviamos un enlace para crear una
              nueva contraseña.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-1 block text-sm font-medium text-gray-700">
                  Correo
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              <Link to="/login" className="font-semibold text-brand-700 hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
