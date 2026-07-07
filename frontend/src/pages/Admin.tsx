import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { KeyRound, Sparkles, Trash2 } from "lucide-react";
import { api, API_BASE } from "../lib/api";
import { Card, Badge, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isPremium: boolean;
  employabilityScore: number;
  createdAt: string;
}

export function Admin() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReset, setLastReset] = useState<{ email: string; tempPassword: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api
      .get<AdminUser[]>("/admin/users")
      .then(setUsers)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (user && user.role !== "admin") return <Navigate to="/" replace />;

  async function handleReset(id: string) {
    setError(null);
    setBusyId(id);
    try {
      const res = await api.post<{ email: string; tempPassword: string }>(`/admin/users/${id}/reset-password`);
      setLastReset(res);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setBusyId(null);
    }
  }

  async function handleTogglePremium(id: string) {
    setBusyId(id);
    try {
      await api.post(`/admin/users/${id}/toggle-premium`);
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!window.confirm(`¿Eliminar la cuenta de ${email}? Esta acción no se puede deshacer.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No se pudo eliminar");
      }
      load();
    } catch (err: any) {
      setError(err.message || "Error al eliminar la cuenta");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administración de Usuarios</h1>
        <p className="text-gray-500">
          Aquí puedes ver todas las cuentas, restablecer contraseñas de acceso, y activar/desactivar
          Premium.
        </p>
      </div>

      {lastReset && (
        <Card className="border border-emerald-200 bg-emerald-50">
          <p className="text-sm text-emerald-800">
            Nueva contraseña temporal para <strong>{lastReset.email}</strong>:{" "}
            <code className="rounded bg-white px-2 py-1 font-mono">{lastReset.tempPassword}</code>
            <br />
            Cópiala ahora — no se volverá a mostrar. Comparte esta contraseña con la persona para que
            inicie sesión y luego decida cómo cambiarla.
          </p>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Card>
        {loading ? (
          <p className="text-gray-500">Cargando usuarios...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500">
                  <th className="py-2 pr-4">Nombre</th>
                  <th className="py-2 pr-4">Correo</th>
                  <th className="py-2 pr-4">Rol</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Creado</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.role === "admin" ? "success" : "neutral"}>{u.role}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={u.isPremium ? "accent" : "neutral"}>{u.isPremium ? "Sí" : "No"}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="md"
                          icon={KeyRound}
                          onClick={() => handleReset(u.id)}
                          disabled={busyId === u.id}
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          Restablecer contraseña
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          icon={Sparkles}
                          onClick={() => handleTogglePremium(u.id)}
                          disabled={busyId === u.id}
                          className="!px-3 !py-1.5 !text-xs"
                        >
                          {u.isPremium ? "Quitar Premium" : "Dar Premium"}
                        </Button>
                        {u.id !== user?.id && (
                          <Button
                            variant="danger"
                            size="md"
                            icon={Trash2}
                            onClick={() => handleDelete(u.id, u.email)}
                            disabled={busyId === u.id}
                            className="!px-3 !py-1.5 !text-xs !shadow-none"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
