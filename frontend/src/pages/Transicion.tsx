import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Clock, TrendingUp, Sparkles, ExternalLink, Bookmark, Check, FileSearch, Search, Info, Target } from "lucide-react";
import { api, API_BASE } from "../lib/api";
import { Card, ProgressBar, Badge, Button } from "../components/ui";
import { CvDropzone } from "../components/CvDropzone";
import { NormalizedJob, PortalSearchLink, CvAnalysisResult, Modality } from "../types";

interface TransitionData {
  hasProfile: boolean;
  automationRisk: number | null;
  adaptationPotential: number | null;
  sectorGrowth: { sector: string; value: number }[];
  currentLevel: number | null;
  requiredLevel: number;
  topSkill: string | null;
  jobSearchQuery: string | null;
  focusMode: "current" | "goal";
  goalTarget: string | null;
  jobs: NormalizedJob[];
  portalLinks: PortalSearchLink[];
}

const COUNTRIES = [
  { code: "co", label: "Colombia" },
  { code: "mx", label: "México" },
  { code: "ar", label: "Argentina" },
  { code: "cl", label: "Chile" },
  { code: "pe", label: "Perú" },
  { code: "br", label: "Brasil" },
];

const MODALITIES: { value: Modality; label: string }[] = [
  { value: "any", label: "Cualquiera" },
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
];

const SOURCE_LABELS: Record<NormalizedJob["source"], string> = {
  spe: "Servicio Público de Empleo",
  adzuna: "Adzuna",
  jooble: "Jooble",
  remotive: "Remotive",
  arbeitnow: "Arbeitnow",
};

function riskLabel(risk: number) {
  if (risk < 40) return { text: "Bajo riesgo", tone: "success" as const };
  if (risk < 70) return { text: "Riesgo moderado", tone: "neutral" as const };
  return { text: "Riesgo alto", tone: "neutral" as const };
}

function adaptationLabel(potential: number) {
  if (potential >= 75) return "Excelente";
  if (potential >= 50) return "Bueno";
  return "En desarrollo";
}

export function Transicion() {
  const location = useLocation();
  const incomingCv = (location.state as { cvResult?: CvAnalysisResult } | null)?.cvResult;

  const [data, setData] = useState<TransitionData | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cvResult, setCvResult] = useState<CvAnalysisResult | null>(incomingCv || null);

  const [country, setCountry] = useState("co");
  const [city, setCity] = useState("");
  const [modality, setModality] = useState<Modality>("any");

  const [generateMode, setGenerateMode] = useState<"ats" | "vacancy">("ats");
  const [generateFormat, setGenerateFormat] = useState<"docx" | "pdf">("docx");
  const [selectedJobKey, setSelectedJobKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  function loadTransition() {
    const params = new URLSearchParams({ country, modality });
    if (city.trim()) params.set("location", city.trim());
    return api.get<TransitionData>(`/transition?${params.toString()}`).then(setData);
  }

  useEffect(() => {
    loadTransition();
  }, [country, city, modality]);

  async function handleSave(job: NormalizedJob) {
    await api.post("/jobs/save", {
      source: job.source,
      externalId: job.externalId,
      title: job.title,
      company: job.company,
      url: job.url,
      tags: job.tags,
      salaryRange: job.salary,
    });
    setSavedIds((prev) => new Set(prev).add(`${job.source}:${job.externalId}`));
  }

  async function handleGenerateCv() {
    if (!cvResult) return;
    setGenerateError(null);
    setGenerating(true);
    try {
      const job =
        generateMode === "vacancy" ? data?.jobs.find((j) => `${j.source}:${j.externalId}` === selectedJobKey) : undefined;
      if (generateMode === "vacancy" && !job) {
        setGenerateError("Selecciona una vacante para adaptar tu CV");
        return;
      }
      const res = await fetch(`${API_BASE}/cv/generate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: cvResult.id, mode: generateMode, format: generateFormat, jobId: job }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Error al generar el CV");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${generateMode === "vacancy" ? (job?.title || "vacante") : "ATS"}.${generateFormat}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setGenerateError(err.message || "Error al generar el CV");
    } finally {
      setGenerating(false);
    }
  }

  if (!data) return <p className="text-gray-500">Cargando...</p>;

  const risk = data.automationRisk !== null ? riskLabel(data.automationRisk) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mapa de Transición Laboral</h1>
        <p className="text-gray-500">Descubre oportunidades compatibles con tu perfil en el mercado latinoamericano</p>
      </div>

      <Card className="border border-brand-100 bg-brand-50/60">
        <div className="mb-2 flex items-center gap-2 text-brand-900">
          <Info size={17} strokeWidth={2.25} />
          <h2 className="font-semibold">Cómo leer este mapa</h2>
        </div>
        <ul className="space-y-1.5 text-sm text-brand-900">
          <li>
            <strong>Riesgo de Automatización:</strong> qué tan probable es que tareas de tu perfil
            actual sean reemplazadas por tecnología — más bajo es mejor.
          </li>
          <li>
            <strong>Potencial de Adaptación:</strong> tu capacidad de aprender y moverte hacia
            nuevas oportunidades, según tu experiencia y disponibilidad para formarte.
          </li>
          <li>
            <strong>Sectores con Mayor Crecimiento:</strong> qué áreas están generando más empleo en
            LATAM ahora mismo — útil como referencia general, no depende de tu perfil.
          </li>
          <li>
            <strong>Nivel Actual vs. Requerido:</strong> compara tu nivel de habilidades hoy contra
            lo que el mercado suele pedir para las oportunidades más demandadas.
          </li>
        </ul>
      </Card>

      {!data.hasProfile && (
        <Card className="border border-accent-200 bg-accent-50">
          <p className="text-sm text-accent-700">
            Todo lo de esta página depende de tu perfil, y aún no tienes uno.{" "}
            <Link to="/evaluacion" className="font-semibold underline">Completa la evaluación</Link>{" "}
            o sube tu CV abajo para ver tu riesgo de automatización, potencial de adaptación y vacantes
            reales compatibles contigo — sin eso no podemos mostrarte nada personalizado.
          </p>
        </Card>
      )}

      {data.hasProfile && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Clock size={16} strokeWidth={2} />
              <span>Riesgo de Automatización</span>
            </div>
            <p className="text-xs text-gray-500">De tus habilidades actuales</p>
            <div className="my-3 flex items-center gap-3">
              <span className="text-3xl font-bold">{data.automationRisk}%</span>
              {risk && <Badge tone={risk.tone}>{risk.text}</Badge>}
            </div>
            <ProgressBar value={data.automationRisk!} />
            <p className="mt-3 text-sm text-gray-500">
              Calculado a partir de las habilidades que registraste en tu evaluación.
            </p>
          </Card>

          <Card>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-500">
              <TrendingUp size={16} strokeWidth={2} />
              <span>Potencial de Adaptación</span>
            </div>
            <p className="text-xs text-gray-500">Capacidad de reentrenamiento</p>
            <div className="my-3 flex items-center gap-3">
              <span className="text-3xl font-bold">{data.adaptationPotential}%</span>
              <Badge tone="success">{adaptationLabel(data.adaptationPotential!)}</Badge>
            </div>
            <ProgressBar value={data.adaptationPotential!} />
            <p className="mt-3 text-sm text-gray-500">
              Basado en tu experiencia, habilidades digitales y disponibilidad para aprender.
            </p>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">Sectores con Mayor Crecimiento en LATAM</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sectorGrowth}>
              <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#365e8c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {data.hasProfile && data.focusMode === "goal" && data.goalTarget && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="mb-1 flex items-center gap-2 text-accent-700">
            <Target size={17} strokeWidth={2.25} />
            <h2 className="font-semibold">Tu meta: {data.goalTarget}</h2>
          </div>
          <p className="text-sm text-accent-700">
            Nos dijiste que buscas dar un giro hacia esto, así que el mapa de abajo se enfoca en esa
            meta en vez de tu posición actual — la búsqueda de vacantes y las recomendaciones apuntan
            a {data.goalTarget}.
          </p>
        </Card>
      )}

      {data.hasProfile && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="text-sm font-medium text-gray-700">
                {data.focusMode === "goal" ? "Tu Nivel de Partida" : "Tu Nivel Actual"}
              </div>
              <p className="text-xs text-gray-500">Basado en tu experiencia y evaluación</p>
              <div className="mt-2 text-2xl font-bold text-brand-800">{data.currentLevel}%</div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-700">Nivel Requerido</div>
              <p className="text-xs text-gray-500">Promedio del mercado laboral</p>
              <div className="mt-2 text-2xl font-bold">{data.requiredLevel}%</div>
            </Card>
          </div>

          <Card className="border border-brand-100 bg-brand-50">
            <p className="text-sm text-brand-900">
              <strong>Recomendación:</strong>{" "}
              {data.focusMode === "goal" && data.goalTarget ? (
                <>
                  Prioriza las habilidades que pide <strong>{data.goalTarget}</strong> — revisa las
                  vacantes y cursos de abajo para identificar cuáles te faltan y empezar a cerrarlas.
                </>
              ) : (
                <>
                  Prioriza mejorar tus habilidades digitales relacionadas con{" "}
                  <strong>{data.topSkill}</strong> para alcanzar el nivel requerido en las
                  oportunidades más demandadas.
                </>
              )}
            </p>
          </Card>
        </>
      )}

      <Card>
        <CvDropzone
          onUploaded={(res) => {
            setCvResult(res);
            loadTransition(); // a successful CV upload can turn hasProfile from false to true
          }}
        />
      </Card>

      {cvResult && (
        <Card className="border border-accent-200 bg-white">
          <div className="mb-1 flex items-center gap-2">
            <Badge tone="accent" icon={Sparkles}>Premium</Badge>
            <h2 className="font-semibold">Generar CV Optimizado</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Convierte tu CV en un documento listo para enviar: optimizado para sistemas ATS, o
            adaptado a una vacante real específica — incluyendo las habilidades que ya registraste
            en tu evaluación, aunque no estuvieran en tu CV original. Función premium — habilitada
            en este prototipo para que la pruebes sin costo.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="cv-mode" className="mb-1 block text-sm font-medium text-gray-700">
                Tipo de CV
              </label>
              <select
                id="cv-mode"
                value={generateMode}
                onChange={(e) => setGenerateMode(e.target.value as "ats" | "vacancy")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="ats">Optimizado para ATS (general)</option>
                <option value="vacancy">Adaptado a una vacante específica</option>
              </select>
            </div>

            <div>
              <label htmlFor="cv-format" className="mb-1 block text-sm font-medium text-gray-700">
                Formato
              </label>
              <select
                id="cv-format"
                value={generateFormat}
                onChange={(e) => setGenerateFormat(e.target.value as "docx" | "pdf")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="docx">Word (.docx)</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {generateMode === "vacancy" && (
              <div>
                <label htmlFor="cv-job" className="mb-1 block text-sm font-medium text-gray-700">
                  Vacante objetivo
                </label>
                <select
                  id="cv-job"
                  value={selectedJobKey}
                  onChange={(e) => setSelectedJobKey(e.target.value)}
                  className="min-w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
                >
                  <option value="">Selecciona una vacante real...</option>
                  {data.jobs.map((job) => {
                    const key = `${job.source}:${job.externalId}`;
                    return (
                      <option key={key} value={key}>
                        {job.title} — {job.company}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <Button variant="secondary" onClick={handleGenerateCv} disabled={generating}>
              {generating ? "Generando..." : `Generar y descargar .${generateFormat}`}
            </Button>
          </div>
          {generateError && <p className="mt-3 text-sm text-red-600">{generateError}</p>}
        </Card>
      )}

      {data.hasProfile && (
        <Card>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-semibold">Oportunidades Laborales Compatibles</h2>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="job-country" className="mb-1 block text-xs font-medium text-gray-500">País</label>
                <select
                  id="job-country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="job-city" className="mb-1 block text-xs font-medium text-gray-500">Ciudad</label>
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="job-city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Bogotá"
                    className="w-32 rounded-lg border border-gray-300 py-1.5 pl-7 pr-2 text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="job-modality" className="mb-1 block text-xs font-medium text-gray-500">Modalidad</label>
                <select
                  id="job-modality"
                  value={modality}
                  onChange={(e) => setModality(e.target.value as Modality)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
                >
                  {MODALITIES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {data.jobSearchQuery && (
            <p className="mb-3 text-xs text-gray-500">
              Buscando: <strong>{data.jobSearchQuery}</strong>
            </p>
          )}

          {data.jobs.length === 0 ? (
            <p className="text-sm text-gray-500">No se encontraron vacantes en este momento. Usa los enlaces de búsqueda directa abajo.</p>
          ) : (
            <div className="space-y-4">
              {data.jobs.map((job) => {
                const key = `${job.source}:${job.externalId}`;
                const isSaved = savedIds.has(key);
                return (
                  <div key={key} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{job.title}</div>
                        <div className="text-sm text-gray-500">
                          {job.company} · {job.location}
                          {job.salary && <> · {job.salary}</>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {job.tags.slice(0, 5).map((t) => (
                            <Badge key={t} tone="neutral">
                              {t}
                            </Badge>
                          ))}
                          <Badge>{SOURCE_LABELS[job.source] || job.source}</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <Button size="md" icon={ExternalLink} iconPosition="right" className="w-full">
                            Ver oferta
                          </Button>
                        </a>
                        <Button
                          variant="outline"
                          onClick={() => handleSave(job)}
                          disabled={isSaved}
                          icon={isSaved ? Check : Bookmark}
                        >
                          {isSaved ? "Guardado" : "Guardar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 border-t border-gray-100 pt-5">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <FileSearch size={16} strokeWidth={2} />
              Buscar más directamente en los portales principales
            </p>
            <div className="flex flex-wrap gap-2">
              {data.portalLinks.map((link) => (
                <a
                  key={link.portal}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  {link.portal}
                  <ExternalLink size={13} strokeWidth={2.25} />
                </a>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
