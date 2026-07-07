import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, TrendingUp, Clock, BookOpen, Star, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { Card, Badge, IconBadge, Button } from "../components/ui";
import { Course, LearningPath } from "../types";

const CATEGORIES = ["Todos", "IA y Tecnología", "Marketing Digital", "Liderazgo", "Finanzas", "Emprendimiento"];

export function Cursos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState("Todos");

  useEffect(() => {
    api.get<LearningPath[]>("/courses/paths").then(setPaths);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "Todos") params.set("category", category);
    if (search) params.set("search", search);
    api
      .get<Course[]>(`/courses?${params.toString()}`)
      .then(setCourses)
      .finally(() => setLoading(false));
  }, [category, search]);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cursos y Rutas de Aprendizaje</h1>
        <p className="text-gray-500">Desarrolla nuevas habilidades con formación corta y práctica, adaptada a tu ritmo</p>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Rutas de Aprendizaje Personalizadas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((path) => (
            <div key={path.id} className="rounded-xl border border-gray-200 p-4">
              <IconBadge icon={TrendingUp} size={36} />
              <div className="mt-2 font-medium">{path.title}</div>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} strokeWidth={2.25} /> {path.weeks} semanas
                </span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen size={13} strokeWidth={2.25} /> {path.courses.length} cursos
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {path.tags.map((t) => (
                  <Badge key={t} tone="neutral">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={16} strokeWidth={2.25} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchParams(e.target.value ? { search: e.target.value } : {});
            }}
            placeholder="Buscar cursos..."
            className="w-64 rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                category === cat ? "bg-brand-700 text-white" : "border border-gray-300 text-gray-600 hover:border-brand-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando cursos...</p>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className={`rounded-xl border p-4 ${
                course.featured ? "border-accent-300 bg-accent-50/30" : "border-gray-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {course.featured && (
                    <Badge tone="accent" icon={Star}>
                      Recomendado para ti
                    </Badge>
                  )}
                  <div className="mt-1 font-medium">{course.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen size={13} strokeWidth={2.25} /> {course.provider}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={13} strokeWidth={2.25} /> {course.durationWeeks} semanas
                    </span>
                    <span>{course.level}</span>
                    {course.rating && (
                      <span className="inline-flex items-center gap-1">
                        <Star size={13} strokeWidth={2.25} className="fill-accent-400 text-accent-500" />
                        {course.rating} ({course.studentsCount?.toLocaleString()} estudiantes)
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {course.tags.map((t) => (
                      <Badge key={t} tone="neutral">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${course.isFree ? "text-emerald-600" : "text-gray-800"}`}>
                    {course.isFree ? "Gratis" : course.priceLabel}
                  </div>
                  <div className="mb-2 text-xs text-gray-500">{course.isFree ? "Acceso completo" : "Ver precio en el sitio"}</div>
                  <a href={course.url} target="_blank" rel="noopener noreferrer">
                    <Button size="md" icon={ExternalLink} iconPosition="right">
                      Comenzar ahora
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <p className="text-sm text-gray-500">No encontramos cursos para esa búsqueda. Prueba con otro término.</p>
          )}
        </div>
      )}
    </div>
  );
}
