import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { api } from "../lib/api";
import { ProgressBar, Badge } from "./ui";
import { CvAnalysisResult } from "../types";

interface CvDropzoneProps {
  onUploaded: (result: CvAnalysisResult) => void;
  title?: string;
  description?: string;
}

export function CvDropzone({
  onUploaded,
  title = "Análisis de Hoja de Vida",
  description = "Sube tu currículum y lo analizaremos para identificar habilidades, experiencia y optimizarlo para sistemas ATS",
}: CvDropzoneProps) {
  const [result, setResult] = useState<CvAnalysisResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setResult(null);
    try {
      const form = new FormData();
      form.append("cv", file);
      const res = await api.post<CvAnalysisResult>("/cv/analyze", form);
      setResult(res);
      onUploaded(res);
    } catch (err: any) {
      setError(err.message || "Error al analizar el CV");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {title && <h2 className="mb-1 font-semibold">{title}</h2>}
      {description && <p className="mb-4 text-sm text-gray-500">{description}</p>}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-10 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      >
        <UploadCloud className="mx-auto text-brand-600" size={32} strokeWidth={1.75} />
        <p className="mt-2 font-medium">Arrastra tu CV aquí o haz clic para seleccionar</p>
        <p className="text-sm text-gray-500">Formatos soportados: PDF, DOC, DOCX (máx. 5MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          aria-label="Subir currículum"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {uploading && <p className="mt-3 text-sm text-gray-500">Analizando tu CV...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-gray-500">Puntaje ATS estimado</span>
            <div className="flex items-center gap-2">
              <Badge tone="brand">{result.professionLabel}</Badge>
              <span className="text-lg font-semibold text-brand-800">{result.atsScore}%</span>
            </div>
          </div>
          <ProgressBar value={result.atsScore} />
          {result.extractedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.extractedSkills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          )}
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-600">
            {result.suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
