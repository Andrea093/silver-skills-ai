import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { TrendingUp, Award, Briefcase, Compass } from "lucide-react";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";

interface DashboardData {
  name: string;
  hasProfile: boolean;
  employabilityScore: number | null;
  skills: { name: string; level: number }[];
  activeSkillsCount: number;
  opportunitiesCount: number;
}

const PIE_COLORS = ["#365e8c", "#d7e0ec"];

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardData>("/dashboard")
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  const firstName = (user?.name || data.name).split(" ")[0];
  const score = data.employabilityScore ?? 0;
  const pieData = [
    { name: "Completado", value: score },
    { name: "Por mejorar", value: 100 - score },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenida, {firstName}</h1>
          <p className="text-gray-500">Tu camino hacia nuevas oportunidades laborales</p>
        </div>
        <Link to="/evaluacion">
          <Button icon={Compass}>{data.hasProfile ? "Actualizar evaluación" : "Completar evaluación"}</Button>
        </Link>
      </div>

      {!data.hasProfile && (
        <Card className="border border-accent-200 bg-accent-50">
          <p className="text-sm text-accent-700">
            Aún no tienes una evaluación ni un CV registrado, así que no hay nada personalizado que
            mostrarte todavía. <Link to="/evaluacion" className="font-semibold underline">Completa la evaluación</Link>{" "}
            o sube tu CV en <Link to="/transicion" className="font-semibold underline">Transición</Link> para
            ver tu índice de empleabilidad, habilidades y vacantes reales compatibles contigo.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className={data.hasProfile ? "bg-brand-800 text-white" : "bg-white"}>
          <div className={`flex items-center justify-between text-sm font-medium ${data.hasProfile ? "text-brand-200" : "text-gray-500"}`}>
            <span>Índice de Empleabilidad</span>
            <TrendingUp size={18} strokeWidth={2} />
          </div>
          {data.hasProfile ? (
            <>
              <div className="mt-1 text-3xl font-bold">{data.employabilityScore}%</div>
              <div className="mt-3">
                <ProgressBar value={data.employabilityScore!} colorClass="bg-white" />
              </div>
            </>
          ) : (
            <div className="mt-1 text-lg font-semibold text-gray-400">Sin evaluar todavía</div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between text-sm font-medium text-gray-500">
            <span>Habilidades Activas</span>
            <Award size={18} strokeWidth={2} />
          </div>
          <div className="mt-1 text-3xl font-bold text-gray-900">{data.activeSkillsCount}</div>
          <p className="mt-1 text-sm text-gray-500">En tu perfil profesional</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {data.skills.slice(0, 2).map((s) => (
              <Badge key={s.name}>{s.name}</Badge>
            ))}
            {data.skills.length > 2 && <Badge tone="neutral">+{data.skills.length - 2}</Badge>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-sm font-medium text-gray-500">
            <span>Oportunidades</span>
            <Briefcase size={18} strokeWidth={2} />
          </div>
          {data.hasProfile ? (
            <>
              <div className="mt-1 text-3xl font-bold text-gray-900">{data.opportunitiesCount}</div>
              <p className="mt-1 text-sm text-gray-500">Vacantes reales compatibles en LATAM</p>
            </>
          ) : (
            <div className="mt-1 text-lg font-semibold text-gray-400">Completa tu perfil</div>
          )}
          <Link to="/transicion" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
            Ver mapa de transición →
          </Link>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Tus Habilidades Actuales</h2>
          {data.skills.length === 0 ? (
            <p className="text-sm text-gray-500">
              Aún no tienes habilidades registradas.{" "}
              <Link to="/evaluacion" className="font-medium text-brand-700 hover:underline">
                Completa tu evaluación
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {data.skills.map((s) => (
                <div key={s.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{s.name}</span>
                    <span className="text-gray-500">{s.level}%</span>
                  </div>
                  <ProgressBar value={s.level} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Distribución de Empleabilidad</h2>
          {data.hasProfile ? (
            <>
              <div className="mx-auto h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={55} outerRadius={80} startAngle={90} endAngle={-270}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-brand-50 py-2">
                  <div className="text-lg font-semibold text-brand-800">{data.employabilityScore}%</div>
                  <div className="text-xs text-gray-500">Completado</div>
                </div>
                <div className="rounded-lg bg-brand-50 py-2">
                  <div className="text-lg font-semibold text-brand-800">{100 - score}%</div>
                  <div className="text-xs text-gray-500">Por mejorar</div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Se calculará automáticamente cuando completes tu evaluación.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
