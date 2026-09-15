import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Award, Briefcase, Compass, Sparkles, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge, Button } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { CvAnalysisResult } from "../types";
import { GenerateCvButton } from "../components/GenerateCvButton";
import { MODULES } from "../lib/modules";

interface DashboardData {
  name: string;
  hasProfile: boolean;
  employabilityScore: number | null;
  skills: { name: string; level: number }[];
  activeSkillsCount: number;
  opportunitiesCount: number;
}

export function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cvResult, setCvResult] = useState<CvAnalysisResult | null>(null);

  useEffect(() => {
    api
      .get<DashboardData>("/dashboard")
      .then(setData)
      .finally(() => setLoading(false));
    // Already saved wherever it was first uploaded (Evaluación, Transición, Actualización) — reused
    // here so the Premium CV buttons work without asking the person to upload it again.
    api
      .get<CvAnalysisResult>("/cv/latest")
      .then(setCvResult)
      .catch(() => {
        // 404 just means no CV uploaded yet
      });
  }, []);

  if (loading) return <p className="text-gray-500">Cargando...</p>;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  const firstName = (user?.name || data.name).split(" ")[0];

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

      {cvResult && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge tone="accent" icon={Sparkles}>Premium</Badge>
                <h2 className="font-semibold">Genera tu CV optimizado</h2>
              </div>
              <p className="mt-1 text-sm text-gray-600">
                Ya tenemos tu CV guardado — úsalo para crear un documento ATS, o adaptado a una
                vacante real específica, sin volver a subirlo.
              </p>
            </div>
            <GenerateCvButton cvResult={cvResult} />
          </div>
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

      <div>
        <h2 className="mb-1 font-semibold">Tus módulos</h2>
        <p className="mb-3 text-sm text-gray-500">
          El detalle de cada uno vive en su propia página — aquí solo el acceso rápido.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <Link
              key={m.key}
              to={m.to}
              className="group rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-center gap-2 text-brand-700">
                <m.icon size={18} strokeWidth={2.25} />
                <span className="font-medium text-gray-900">{m.label}</span>
              </div>
              <p className="mt-1.5 text-sm text-gray-500">{m.description}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">
                Ir al módulo <ArrowRight size={13} strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
