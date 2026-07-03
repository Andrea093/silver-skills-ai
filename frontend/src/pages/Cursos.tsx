import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { Card, Badge } from "../components/ui";
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
        <h1 className="text-2xl font-semibold">Cursos y Rutas de Aprendizaje</h1>
        <p className="text-gray-500">Desarrolla nuevas habilidades con formación corta y práctica, adaptada a tu ritmo</p>
      </div>

      <Card>
        <h2 className="mb-4 font-semibold">Rutas de Aprendizaje Personalizadas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {paths.map((path) => (
            <div key={path.id} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                📈
              </div>
              <div className="font-medium">{path.title}</div>
              <div className="mt-1 text-sm text-gray-500">
                ⏱ {path.weeks} semanas · 📖 {path.courses.length} cursos
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {path.tags.map((t) => (
                  <Badge key={t} tone="gray">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchParams(e.target.value ? { search: e.target.value } : {});
          }}
          placeholder="Buscar cursos..."
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === cat ? "bg-brand-600 text-white" : "border border-gray-300 text-gray-600"
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
                course.featured ? "border-brand-300" : "border-gray-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {course.featured && <Badge>⭐ Recomendado para ti</Badge>}
                  <div className="mt-1 font-medium">{course.title}</div>
                  <div className="mt-1 text-sm text-gray-500">
                    📖 {course.provider} · ⏱ {course.durationWeeks} semanas · 🎓 {course.level}
                    {course.rating && (
                      <>
                        {" "}
                        · ⭐ {course.rating} ({course.studentsCount?.toLocaleString()} estudiantes)
                      </>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {course.tags.map((t) => (
                      <Badge key={t} tone="gray">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${course.isFree ? "text-green-600" : "text-gray-800"}`}>
                    {course.isFree ? "Gratis" : course.priceLabel}
                  </div>
                  <div className="mb-2 text-xs text-gray-500">{course.isFree ? "Acceso completo" : "Ver precio en el sitio"}</div>
                  <a
                    href={course.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Comenzar ahora ↗
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
