import { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../lib/api";
import { Card, ProgressBar, Badge } from "../components/ui";
import { NormalizedJob, PortalSearchLink } from "../types";

interface TransitionData {
  automationRisk: number;
  adaptationPotential: number;
  sectorGrowth: { sector: string; value: number }[];
  currentLevel: number;
  requiredLevel: number;
  topSkill: string;
  jobs: NormalizedJob[];
  portalLinks: PortalSearchLink[];
}

interface CvAnalysisResult {
  id: string;
  filename: string;
  extractedSkills: string[];
  atsScore: number;
  suggestions: string[];
}

function riskLabel(risk: number) {
  if (risk < 40) return { text: "Bajo riesgo", tone: "green" as const };
  if (risk < 70) return { text: "Riesgo moderado", tone: "gray" as const };
  return { text: "Riesgo alto", tone: "gray" as const };
}

function adaptationLabel(potential: number) {
  if (potential >= 75) return "Excelente";
  if (potential >= 50) return "Bueno";
  return "En desarrollo";
}

export function Transicion() {
  const [data, setData] = useState<TransitionData | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [cvResult, setCvResult] = useState<CvAnalysisResult | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [generateMode, setGenerateMode] = useState<"ats" | "vacancy">("ats");
  const [selectedJobKey, setSelectedJobKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TransitionData>("/transition?country=mx").then(setData);
  }, []);

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

  async function handleFile(file: File) {
    setCvError(null);
    setCvUploading(true);
    setCvResult(null);
    try {
      const form = new FormData();
      form.append("cv", file);
      const res = await api.post<CvAnalysisResult>("/cv/analyze", form);
      setCvResult(res);
    } catch (err: any) {
      setCvError(err.message || "Error al analizar el CV");
    } finally {
      setCvUploading(false);
    }
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
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: cvResult.id, mode: generateMode, jobId: job }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Error al generar el CV");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV_${generateMode === "vacancy" ? (job?.title || "vacante") : "ATS"}.docx`;
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

  const risk = riskLabel(data.automationRisk);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mapa de Transición Laboral</h1>
        <p className="text-gray-500">Descubre oportunidades compatibles con tu perfil en el mercado latinoamericano</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <span>⏱️</span>
            <span>Riesgo de Automatización</span>
          </div>
          <p className="text-xs text-gray-500">De tus habilidades actuales</p>
          <div className="my-3 flex items-center gap-3">
            <span className="text-3xl font-bold">{data.automationRisk}%</span>
            <Badge tone={risk.tone}>{risk.text}</Badge>
          </div>
          <ProgressBar value={data.automationRisk} />
          <p className="mt-3 text-sm text-gray-500">
            Tus habilidades de liderazgo y comunicación tienen bajo riesgo de automatización.
          </p>
        </Card>

        <Card>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <span>📈</span>
            <span>Potencial de Adaptación</span>
          </div>
          <p className="text-xs text-gray-500">Capacidad de reentrenamiento</p>
          <div className="my-3 flex items-center gap-3">
            <span className="text-3xl font-bold">{data.adaptationPotential}%</span>
            <Badge tone="green">{adaptationLabel(data.adaptationPotential)}</Badge>
          </div>
          <ProgressBar value={data.adaptationPotential} />
          <p className="mt-3 text-sm text-gray-500">
            Tu experiencia y perfil son ideales para roles de consultoría y transformación.
          </p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Sectores con Mayor Crecimiento en LATAM</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.sectorGrowth}>
              <XAxis dataKey="sector" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="text-sm font-medium text-gray-700">Tu Nivel Actual</div>
          <p className="text-xs text-gray-500">Basado en tu experiencia y evaluación</p>
          <div className="mt-2 text-2xl font-bold text-brand-700">{data.currentLevel}%</div>
        </Card>
        <Card>
          <div className="text-sm font-medium text-gray-700">Nivel Requerido</div>
          <p className="text-xs text-gray-500">Promedio del mercado laboral</p>
          <div className="mt-2 text-2xl font-bold">{data.requiredLevel}%</div>
        </Card>
      </div>

      <Card className="bg-brand-50">
        <p className="text-sm text-brand-800">
          <strong>Recomendación:</strong> Prioriza mejorar tus habilidades digitales relacionadas con{" "}
          <strong>{data.topSkill}</strong> para alcanzar el nivel requerido en las oportunidades más demandadas.
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 font-semibold">Análisis de Hoja de Vida</h2>
        <p className="mb-4 text-sm text-gray-500">
          Sube tu currículum y lo analizaremos para identificar habilidades, experiencia y optimizarlo para sistemas ATS
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-10 text-center transition hover:border-brand-400"
        >
          <div className="text-3xl">⬆️</div>
          <p className="mt-2 font-medium">Arrastra tu CV aquí o haz clic para seleccionar</p>
          <p className="text-sm text-gray-500">Formatos soportados: PDF, DOC, DOCX (máx. 5MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
        {cvUploading && <p className="mt-3 text-sm text-gray-500">Analizando tu CV...</p>}
        {cvError && <p className="mt-3 text-sm text-red-600">{cvError}</p>}
        {cvResult && (
          <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Puntaje ATS estimado</span>
              <span className="text-lg font-semibold text-brand-700">{cvResult.atsScore}%</span>
            </div>
            <ProgressBar value={cvResult.atsScore} />
            {cvResult.extractedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {cvResult.extractedSkills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
            )}
            <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
              {cvResult.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {cvResult && (
        <Card className="border-2 border-brand-200 bg-white">
          <div className="mb-1 flex items-center gap-2">
            <Badge>✨ Premium</Badge>
            <h2 className="font-semibold">Generar CV Optimizado</h2>
          </div>
          <p className="mb-4 text-sm text-gray-500">
            Convierte tu CV en un documento Word listo para enviar: optimizado para sistemas ATS, o
            adaptado a una vacante real específica. Función premium — habilitada en este prototipo
            para que la pruebes sin costo.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de CV</label>
              <select
                value={generateMode}
                onChange={(e) => setGenerateMode(e.target.value as "ats" | "vacancy")}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="ats">Optimizado para ATS (general)</option>
                <option value="vacancy">Adaptado a una vacante específica</option>
              </select>
            </div>

            {generateMode === "vacancy" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Vacante objetivo</label>
                <select
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

            <button
              onClick={handleGenerateCv}
              disabled={generating}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? "Generando..." : "Generar y descargar .docx"}
            </button>
          </div>
          {generateError && <p className="mt-3 text-sm text-red-600">{generateError}</p>}
        </Card>
      )}

      <Card>
        <h2 className="mb-4 font-semibold">Oportunidades Laborales Compatibles</h2>
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
                          <Badge key={t} tone="gray">
                            {t}
                          </Badge>
                        ))}
                        <Badge>{job.source}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-brand-700"
                      >
                        Ver oferta ↗
                      </a>
                      <button
                        onClick={() => handleSave(job)}
                        disabled={isSaved}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:border-brand-300 disabled:opacity-50"
                      >
                        {isSaved ? "Guardado ✓" : "Guardar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 border-t border-gray-100 pt-5">
          <p className="mb-3 text-sm font-medium text-gray-700">Buscar más directamente en los portales principales</p>
          <div className="flex flex-wrap gap-2">
            {data.portalLinks.map((link) => (
              <a
                key={link.portal}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:border-brand-400 hover:text-brand-700"
              >
                {link.portal} ↗
              </a>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
