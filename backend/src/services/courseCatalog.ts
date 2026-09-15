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

// A plain substring check misses common abbreviations people actually search with — "IA" (or the
// full "Inteligencia Artificial", which is what gets passed in from the recommended-skills cards)
// doesn't literally appear inside a tag like "IA Generativa" as a substring match either way once
// case is normalized, and "Gestión Remota" doesn't literally appear in "Trabajo Remoto e Híbrido"
// even though they're clearly the same topic. This expands a search term with its known synonyms
// before matching, instead of trying to be clever with fuzzy/partial word matching that would just
// as easily produce false positives.
const SEARCH_ALIASES: Record<string, string[]> = {
  "inteligencia artificial": ["ia", "ai", "ia generativa", "chatgpt", "generative ai"],
  ia: ["inteligencia artificial", "ai"],
  "gestión remota": ["trabajo remoto", "equipos remotos", "liderazgo remoto", "home office", "híbrido"],
  "trabajo remoto": ["gestión remota", "home office", "híbrido"],
  "análisis de datos": ["data analytics", "datos", "excel"],
  "marketing digital": ["marketing", "redes sociales", "seo"],
};

function expandSearchTerms(query: string): string[] {
  const q = query.toLowerCase().trim();
  return [q, ...(SEARCH_ALIASES[q] || [])];
}

// A short single-word term like "ia" as a plain substring check matches inside completely
// unrelated words ("Inteligencia Emocional", "Especialización" both contain "ia") — same problem
// professionProfiles.ts's matchesKeyword solves the same way: word-boundary match for a single
// word, plain substring for a multi-word phrase (a phrase is specific enough that false positives
// there are a non-issue).
function matchesTerm(haystack: string, term: string): boolean {
  if (/\s/.test(term)) return haystack.includes(term);
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(haystack);
}

function matchesSearch(c: { title: string; provider: string; tags: string }, terms: string[]): boolean {
  // Deliberately excludes `category` — categories here are coarse umbrellas (e.g. "IA y
  // Tecnología" covers everything from prompt engineering to a plain Excel/data-analytics course),
  // so matching on it made an "Inteligencia Artificial" search pull in unrelated courses that just
  // happen to share the same broad category. The category filter buttons already cover browsing by
  // category; a text search should match what a course is actually *about* (title/provider/tags).
  const tags: string[] = JSON.parse(c.tags);
  const haystack = `${c.title} ${c.provider} ${tags.join(" ")}`.toLowerCase();
  return terms.some((term) => matchesTerm(haystack, term));
}

export async function listCourses(params: {
  category?: string;
  search?: string;
  recommendedSkillNames?: string[];
  goalContext?: { intent: "change" | "stay"; target: string | null };
}) {
  const { category, search, recommendedSkillNames, goalContext } = params;
  const all = await prisma.course.findMany({ orderBy: [{ featured: "desc" }, { rating: "desc" }] });

  const personalize = Boolean(recommendedSkillNames && recommendedSkillNames.length > 0);
  // Each recommended skill gets the same alias expansion as a manual search — otherwise a
  // profession's recommended skill ("Gestión Remota") never lights up the "recomendado para ti"
  // badge on a course tagged with its real-world synonym ("Trabajo Remoto e Híbrido").
  const recommendedTermSets = (recommendedSkillNames || []).map((s) => expandSearchTerms(s));
  const wantsChange = goalContext?.intent === "change";
  const goalTargetWords = (goalContext?.target || "").toLowerCase();
  const searchTerms = search ? expandSearchTerms(search) : null;

  const categoryFiltered = all.filter((c) => !category || category === "Todos" || c.category === category);
  const searched = searchTerms ? categoryFiltered.filter((c) => matchesSearch(c, searchTerms)) : categoryFiltered;

  // A real curated match beats a generic provider search link — but zero curated matches (a topic
  // the seed catalog genuinely doesn't cover yet, like a niche recommended skill) used to just show
  // "no encontramos cursos" and stop there. Falling back to real search links (same pattern
  // searchCoursesByTopic already uses for the Mentor) means a search never dead-ends.
  if (search && searched.length === 0) {
    return Object.keys(PROVIDER_SEARCH_BUILDERS).map((provider) => ({
      id: `search-link-${provider}`,
      title: `Buscar "${search}" en ${provider}`,
      provider,
      url: buildProviderSearchLink(provider, search),
      isFree: null,
      priceLabel: "Ver en el sitio",
      durationWeeks: null,
      level: null,
      rating: null,
      studentsCount: null,
      tags: [search],
      category: category || "",
      featured: false,
      programType: "course",
      isSearchLink: true,
    }));
  }

  return searched
    .map((c) => {
      const tags: string[] = JSON.parse(c.tags);
      const matchesGoalTarget =
        wantsChange &&
        goalTargetWords.length > 0 &&
        (c.category.toLowerCase().includes(goalTargetWords) ||
          goalTargetWords.includes(c.category.toLowerCase()) ||
          tags.some((t) => goalTargetWords.includes(t.toLowerCase()) || t.toLowerCase().includes(goalTargetWords)));
      // Once we know the user's own recommended/weak skills (from their assessment), "recommended
      // for you" reflects that instead of the static catalog-wide featured flag. When the person
      // said they want to change careers (not just upskill), a university program that matches
      // their stated goal is a stronger recommendation than a short course for their current gaps.
      const featured =
        c.programType !== "course" && matchesGoalTarget
          ? true
          : personalize
          ? recommendedTermSets.some((terms) => matchesSearch(c, terms))
          : c.featured;
      return { ...c, tags, featured };
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
}

export async function searchCoursesByTopic(topic: string) {
  const terms = expandSearchTerms(topic);
  const all = await prisma.course.findMany();
  const matches = all
    .filter((c) => matchesSearch(c, terms))
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
