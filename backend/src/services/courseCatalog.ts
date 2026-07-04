import { prisma } from "../lib/prisma";

const PROVIDER_SEARCH_BUILDERS: Record<string, (topic: string) => string> = {
  Coursera: (topic) => `https://www.coursera.org/search?query=${encodeURIComponent(topic)}`,
  Udemy: (topic) => `https://www.udemy.com/courses/search/?q=${encodeURIComponent(topic)}`,
  edX: (topic) => `https://www.edx.org/search?q=${encodeURIComponent(topic)}`,
  "LinkedIn Learning": (topic) =>
    `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(topic)}`,
};

/**
 * For topics outside the curated seed catalog, link out to the provider's real
 * search results page instead of guessing an unverifiable course-detail URL.
 */
export function buildProviderSearchLink(provider: string, topic: string): string {
  const builder = PROVIDER_SEARCH_BUILDERS[provider];
  if (builder) return builder(topic);
  return `https://www.google.com/search?q=${encodeURIComponent(`${provider} curso ${topic}`)}`;
}

export async function listCourses(params: { category?: string; search?: string; recommendedSkillNames?: string[] }) {
  const { category, search, recommendedSkillNames } = params;
  const all = await prisma.course.findMany({ orderBy: [{ featured: "desc" }, { rating: "desc" }] });

  const personalize = Boolean(recommendedSkillNames && recommendedSkillNames.length > 0);
  const recommended = (recommendedSkillNames || []).map((s) => s.toLowerCase());

  return all
    .filter((c) => !category || category === "Todos" || c.category === category)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      const tags: string[] = JSON.parse(c.tags);
      return (
        c.title.toLowerCase().includes(q) ||
        c.provider.toLowerCase().includes(q) ||
        tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .map((c) => {
      const tags: string[] = JSON.parse(c.tags);
      // Once we know the user's own recommended/weak skills (from their assessment), "recommended
      // for you" reflects that instead of the static catalog-wide featured flag.
      const featured = personalize
        ? recommended.some((skill) => tags.some((t) => t.toLowerCase().includes(skill)) || c.category.toLowerCase().includes(skill))
        : c.featured;
      return { ...c, tags, featured };
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
}

export async function searchCoursesByTopic(topic: string) {
  const q = topic.toLowerCase();
  const all = await prisma.course.findMany();
  const matches = all
    .filter((c) => {
      const tags: string[] = JSON.parse(c.tags);
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .slice(0, 5)
    .map((c) => ({ ...c, tags: JSON.parse(c.tags) }));

  if (matches.length > 0) return matches;

  // No curated match: fall back to real provider search links so the mentor never invents a course.
  return Object.keys(PROVIDER_SEARCH_BUILDERS).map((provider) => ({
    title: `Buscar "${topic}" en ${provider}`,
    provider,
    url: buildProviderSearchLink(provider, topic),
    isFree: null,
    priceLabel: "Ver en el sitio",
    tags: [topic],
    isSearchLink: true,
  }));
}

export async function listLearningPaths() {
  const paths = await prisma.learningPath.findMany();
  const courses = await prisma.course.findMany();
  const courseById = new Map(courses.map((c) => [c.id, { ...c, tags: JSON.parse(c.tags) }]));
  return paths.map((p) => ({
    ...p,
    tags: JSON.parse(p.tags),
    courseIds: JSON.parse(p.courseIds),
    courses: (JSON.parse(p.courseIds) as string[]).map((id) => courseById.get(id)).filter(Boolean),
  }));
}
