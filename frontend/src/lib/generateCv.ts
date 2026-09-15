import { API_BASE } from "./api";
import { NormalizedJob } from "../types";

// Shared by every "Generar mi CV" button (Evaluación, Dashboard, Actualización, Transición) — the
// endpoint returns a raw file blob, not JSON, so it can't go through the regular `api` helper. A
// plain fetch() call here used to only live inside Transición, so clicking the card everywhere
// else just navigated there instead of actually generating anything, which read as "the button
// doesn't work" even though the person had already done everything needed to generate a CV.
export async function generateAndDownloadCv(params: {
  analysisId: string;
  mode: "ats" | "vacancy";
  format: "docx" | "pdf";
  job?: NormalizedJob;
}): Promise<void> {
  const { analysisId, mode, format, job } = params;
  const res = await fetch(`${API_BASE}/cv/generate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ analysisId, mode, format, jobId: job }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Error al generar el CV");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `CV_${mode === "vacancy" ? (job?.title || "vacante") : "ATS"}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
