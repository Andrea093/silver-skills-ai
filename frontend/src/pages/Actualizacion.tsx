import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { Card, Badge, Button } from "../components/ui";

interface SkillResource {
  title: string;
  provider: string;
  url: string;
  isFree: boolean | null;
  priceLabel: string;
  tags: string[];
  isSearchLink?: boolean;
}

interface SkillGap {
  skill: string;
  resource: SkillResource | null;
}

interface SkillsUpdateData {
  hasProfile: boolean;
  professionId?: string;
  professionLabel?: string;
  owned?: string[];
  gaps?: SkillGap[];
  totalGapsCount?: number;
}

export function Actualizacion() {
  const [data, setData] = useState<SkillsUpdateData | null>(null);

  useEffect(() => {
    api.get<SkillsUpdateData>("/skills-update").then(setData);
  }, []);

  if (!data) return <p className="text-gray-500">Cargando...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Actualización de Habilidades</h1>
        <p className="text-gray-500">
          Para quienes ya tienen empleo: descubre qué habilidades del siglo XXI conviene sumar para
          seguir siendo competitivo en tu profesión.
        </p>
      </div>

      {!data.hasProfile && (
        <Card className="border border-accent-200 bg-accent-50">
          <p className="text-sm text-accent-700">
            Para ver qué habilidades actualizar en tu profesión, primero necesitamos conocer tu
            perfil. <Link to="/evaluacion" className="font-semibold underline">Completa la evaluación</Link>{" "}
            o sube tu CV en <Link to="/transicion" className="font-semibold underline">Transición</Link>.
          </p>
        </Card>
      )}

      {data.hasProfile && (
        <>
          <Card>
            <div className="flex items-center gap-2">
              <RefreshCw size={18} strokeWidth={2} className="text-brand-700" />
              <span className="text-sm font-medium text-gray-500">Perfil detectado</span>
            </div>
            <div className="mt-2">
              <Badge tone="brand">{data.professionLabel}</Badge>
            </div>
            {data.professionId === "general" && (
              <p className="mt-3 text-sm text-gray-500">
                Sube tu CV en <Link to="/transicion" className="font-medium text-brand-700 hover:underline">Transición</Link>{" "}
                para una detección de profesión más precisa.
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold">Habilidades que ya dominas</h2>
            {!data.owned || data.owned.length === 0 ? (
              <p className="text-sm text-gray-500">
                Aún no tienes ninguna de las habilidades clave de tu profesión registradas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.owned.map((name) => (
                  <Badge key={name} tone="success" icon={CheckCircle2}>
                    {name}
                  </Badge>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-1 font-semibold">Habilidades para actualizar</h2>
            <p className="mb-4 text-sm text-gray-500">
              Recomendadas según tu profesión y las tendencias de habilidades del siglo XXI.
            </p>
            {!data.gaps || data.gaps.length === 0 ? (
              <p className="text-sm text-gray-500">
                ¡Ya cubres todas las habilidades clave que identificamos para tu profesión!
              </p>
            ) : (
              <div className="space-y-4">
                {data.gaps.map(({ skill, resource }) => (
                  <div key={skill} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <Badge tone="accent">Por actualizar</Badge>
                        <div className="mt-1 font-medium">{skill}</div>
                        {resource && (
                          <div className="mt-1 text-sm text-gray-500">{resource.provider}</div>
                        )}
                      </div>
                      {resource && (
                        <div className="text-right">
                          <div className={`font-semibold ${resource.isFree ? "text-emerald-600" : "text-gray-800"}`}>
                            {resource.isFree ? "Gratis" : resource.priceLabel}
                          </div>
                          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block">
                            <Button size="md" icon={ExternalLink} iconPosition="right">
                              {resource.isSearchLink ? "Buscar" : "Comenzar ahora"}
                            </Button>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {data.totalGapsCount && data.gaps && data.totalGapsCount > data.gaps.length && (
                  <p className="text-sm text-gray-500">
                    +{data.totalGapsCount - data.gaps.length} habilidades más para actualizar.
                  </p>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
