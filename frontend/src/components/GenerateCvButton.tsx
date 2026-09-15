import { useState } from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Button } from "./ui";
import { CvAnalysisResult } from "../types";
import { generateAndDownloadCv } from "../lib/generateCv";

// Used by every "Generar mi CV" Premium card (Evaluación, Dashboard, Actualización) — generates
// and downloads an ATS-optimized CV right where the button is, instead of navigating to Transición
// and leaving the person to find and click a second button there, which read as "this button
// doesn't work, it just takes me somewhere else."
export function GenerateCvButton({ cvResult }: { cvResult: CvAnalysisResult }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setGenerating(true);
    try {
      await generateAndDownloadCv({ analysisId: cvResult.id, mode: "ats", format: "docx" });
    } catch (err: any) {
      setError(err.message || "No pudimos generar tu CV. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <Button variant="secondary" icon={FileText} onClick={handleClick} disabled={generating}>
        {generating ? "Generando..." : "Generar mi CV"}
      </Button>
      <Link to="/transicion" state={{ cvResult }} className="text-xs font-medium text-accent-700 hover:underline">
        ¿Adaptarla a una vacante específica? →
      </Link>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
