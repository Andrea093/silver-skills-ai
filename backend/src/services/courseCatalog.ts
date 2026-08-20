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
    .map((c) => ({ ...c, tags: JSON.parse(c.tags), isSearchLink: false }));

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

export async function listLearningPaths(recommendedSkillNames: string[] = []) {
  const paths = await prisma.learningPath.findMany();
  const courses = await prisma.course.findMany();
  const courseById = new Map(courses.map((c) => [c.id, { ...c, tags: JSON.parse(c.tags) }]));

  const recommended = recommendedSkillNames.map((s) => s.toLowerCase());

  const withMatchCount = paths.map((p) => {
    const tags: string[] = JSON.parse(p.tags);
    const pathCourses = (JSON.parse(p.courseIds) as string[]).map((id) => courseById.get(id)).filter(Boolean) as (ReturnType<typeof courseById.get> & {})[];
    // Count of the person's own weak/missing skills this path actually covers (via its tags or its
    // courses' tags/category) — not just whether it covers at least one. Marking every partial
    // overlap as "recommended" (the same broad match listCourses above uses for individual courses)
    // ends up highlighting almost every path, which stops meaning anything — one clear standout
    // orients the person better than everything being equally "recommended".
    const matchCount = recommended.filter(
      (skill) =>
        tags.some((t) => t.toLowerCase().includes(skill)) ||
        pathCourses.some((c: any) => c.tags.some((t: string) => t.toLowerCase().includes(skill)) || c.category.toLowerCase().includes(skill))
    ).length;
    return { ...p, tags, courseIds: JSON.parse(p.courseIds), courses: pathCourses, matchCount };
  });

  const bestCount = Math.max(0, ...withMatchCount.map((p) => p.matchCount));
  return withMatchCount
    .map(({ matchCount, ...p }) => ({ ...p, recommended: bestCount > 0 && matchCount === bestCount }))
    .sort((a, b) => Number(b.recommended) - Number(a.recommended));
}
