import { env, isAdzunaEnabled, isJoobleEnabled } from "../lib/env";

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export type Modality = "remote" | "hybrid" | "onsite" | "any";

export interface JobSearchOptions {
  location?: string; // free-text city, e.g. "Bogotá"
  modality?: Modality;
}

function matchesModality(text: string, modality: Modality | undefined): boolean {
  if (!modality || modality === "any") return true;
  const t = text.toLowerCase();
  if (modality === "remote") return /remot[oa]|remote|teletrabajo|home\s?office/.test(t);
  if (modality === "hybrid") return /h[ií]brid[oa]|hybrid/.test(t);
  if (modality === "onsite") return /presencial|on[-\s]?site|en\s+oficina/.test(t);
  return true;
}

const QUERY_STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "en", "con", "al", "un", "una", "para", "por", "a",
]);

function significantWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !QUERY_STOPWORDS.has(w));
}

/**
 * Word-overlap match, not a full-phrase substring match — job boards rarely contain a whole
 * multi-word query verbatim ("Docente de Física y Matemáticas"), so requiring that zeroes out
 * results that would otherwise be relevant. Matching on any significant keyword is generous but
 * correctly excludes boards (like Remotive, 100% tech listings) that share no vocabulary at all.
 */
function queryMatches(haystack: string, query: string): boolean {
  const words = significantWords(query);
  if (words.length === 0) return true;
  const h = haystack.toLowerCase();
  return words.some((w) => h.includes(w));
}

export interface NormalizedJob {
  source: "adzuna" | "remotive" | "arbeitnow" | "jooble";
  externalId: string;
  title: string;
  company: string;
  url: string;
  location: string;
  tags: string[];
  salary?: string;
  postedAt?: string;
  description?: string;
}

export interface PortalSearchLink {
  portal: string;
  url: string;
}

/**
 * Real, no-key job board: https://remotive.com/api/remote-jobs
 * Remote-only by nature, so it's skipped entirely when a specific onsite/hybrid modality is requested.
 * Remotive's own `search` query param is silently ignored server-side (verified: it returns the
 * identical full job list regardless of the search term, including nonsense strings), so this
 * fetches their full current listing and filters client-side like Arbeitnow.
 */
async function searchRemotive(query: string, opts: JobSearchOptions): Promise<NormalizedJob[]> {
  if (opts.modality === "hybrid" || opts.modality === "onsite") return [];
  try {
    const url = `https://remotive.com/api/remote-jobs?limit=200`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    const filtered = jobs.filter((j: any) => {
      const haystack = `${j.title} ${j.category || ""} ${(j.tags || []).join(" ")}`;
      return queryMatches(haystack, query);
    });
    return filtered.slice(0, 10).map((j: any) => ({
      source: "remotive" as const,
      externalId: String(j.id),
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.candidate_required_location || "Remoto",
      tags: Array.isArray(j.tags) ? j.tags : [],
      salary: j.salary || undefined,
      postedAt: j.publication_date,
      description: stripHtml(j.description),
    }));
  } catch {
    return [];
  }
}

/**
 * Real, no-key job board: https://www.arbeitnow.com/api/job-board-api
 */
async function searchArbeitnow(query: string, opts: JobSearchOptions): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.data) ? data.data : [];
    // Arbeitnow is Europe/remote-heavy with sparse city data, so `location` isn't used to filter
    // here (it would zero out most results) — only its real `remote` flag is, for modality.
    const filtered = jobs.filter((j: any) => {
      const haystack = `${j.title} ${(j.tags || []).join(" ")}`;
      if (!queryMatches(haystack, query)) return false;
      if (opts.modality === "remote" && !j.remote) return false;
      if ((opts.modality === "hybrid" || opts.modality === "onsite") && j.remote) return false;
      return true;
    });
    return filtered.slice(0, 10).map((j: any) => ({
      source: "arbeitnow" as const,
      externalId: String(j.slug),
      title: j.title,
      company: j.company_name,
      url: j.url,
      location: j.location || (j.remote ? "Remoto" : "N/A"),
      tags: Array.isArray(j.tags) ? j.tags : [],
      postedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined,
      description: stripHtml(j.description),
    }));
  } catch {
    return [];
  }
}

/**
 * Real job data, requires free developer keys from https://developer.adzuna.com/. Coverage is
 * strong for Mexico/Brazil; Colombia is not on Adzuna's officially supported country list, so this
 * quietly returns nothing there rather than erroring.
 */
async function searchAdzuna(query: string, country: string, opts: JobSearchOptions): Promise<NormalizedJob[]> {
  if (!isAdzunaEnabled()) return [];
  try {
    const countryCode = country || "mx";
    const params = new URLSearchParams({
      app_id: env.adzunaAppId!,
      app_key: env.adzunaAppKey!,
      results_per_page: "10",
      what: query,
      "content-type": "application/json",
    });
    if (opts.location) params.set("where", opts.location);
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.results) ? data.results : [];
    return jobs
      .map((j: any) => ({
        source: "adzuna" as const,
        externalId: String(j.id),
        title: j.title,
        company: j.company?.display_name || "N/A",
        url: j.redirect_url,
        location: j.location?.display_name || "N/A",
        tags: j.category?.label ? [j.category.label] : [],
        salary:
          j.salary_min && j.salary_max
            ? `$${Math.round(j.salary_min)} - $${Math.round(j.salary_max)}`
            : undefined,
        postedAt: j.created,
        description: stripHtml(j.description),
      }))
      .filter((j: NormalizedJob) => matchesModality(`${j.title} ${j.description || ""}`, opts.modality));
  } catch {
    return [];
  }
}

/**
 * Real job data covering Colombia/LATAM strongly (jooble.org). Requires a free API key requested
 * manually at https://jooble.org/api/about (name/role/email/site — not instant approval). Request
 * shape follows Jooble's documented REST contract; if it ever changes, this quietly returns []
 * like every other source here rather than breaking the page.
 */
async function searchJooble(query: string, opts: JobSearchOptions): Promise<NormalizedJob[]> {
  if (!isJoobleEnabled()) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${env.joobleApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: query, location: opts.location || "" }),
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    return jobs
      .slice(0, 10)
      .map((j: any) => ({
        source: "jooble" as const,
        externalId: String(j.id || j.link),
        title: j.title,
        company: j.company || "N/A",
        url: j.link,
        location: j.location || "N/A",
        tags: j.type ? [j.type] : [],
        salary: j.salary || undefined,
        postedAt: j.updated,
        description: stripHtml(j.snippet),
      }))
      .filter((j: NormalizedJob) => matchesModality(`${j.title} ${j.description || ""}`, opts.modality));
  } catch {
    return [];
  }
}

export async function searchJobs(query: string, country = "mx", opts: JobSearchOptions = {}): Promise<NormalizedJob[]> {
  const [adzuna, jooble, remotive, arbeitnow] = await Promise.all([
    searchAdzuna(query, country, opts),
    searchJooble(query, opts),
    searchRemotive(query, opts),
    searchArbeitnow(query, opts),
  ]);
  return [...adzuna, ...jooble, ...remotive, ...arbeitnow];
}

const COUNTRY_NAMES: Record<string, string> = {
  mx: "México",
  co: "Colombia",
  ar: "Argentina",
  br: "Brasil",
  cl: "Chile",
  pe: "Perú",
};

// Computrabajo publishes a separate real domain per country.
const COMPUTRABAJO_DOMAIN: Record<string, string> = {
  mx: "com.mx",
  co: "com.co",
  ar: "com.ar",
  cl: "cl",
  pe: "com.pe",
  br: "com.br",
};

// LinkedIn's real, documented work-type filter param: 1=On-site, 2=Remote, 3=Hybrid.
const LINKEDIN_WORK_TYPE: Record<Exclude<Modality, "any">, string> = {
  onsite: "1",
  remote: "2",
  hybrid: "3",
};

/**
 * LinkedIn/Indeed/Computrabajo/OCC don't offer free public search APIs, so instead of
 * fabricating listings we build real, working search-result deep links on each portal, now
 * parameterized by city and modality so the search the person lands on is actually relevant.
 */
export function buildPortalSearchLinks(
  query: string,
  country = "mx",
  location?: string,
  modality?: Modality
): PortalSearchLink[] {
  const q = encodeURIComponent(query);
  const countryName = COUNTRY_NAMES[country] || "México";
  const computrabajoDomain = COMPUTRABAJO_DOMAIN[country] || "com";
  const place = location ? `${location}, ${countryName}` : countryName;
  const placeParam = encodeURIComponent(place);

  let linkedinUrl = `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${placeParam}`;
  if (modality && modality !== "any") linkedinUrl += `&f_WT=${LINKEDIN_WORK_TYPE[modality]}`;

  const modalityWord = modality === "remote" ? " remoto" : modality === "hybrid" ? " híbrido" : modality === "onsite" ? " presencial" : "";
  const indeedQuery = encodeURIComponent(`${query}${modalityWord}`);

  const links: PortalSearchLink[] = [
    { portal: "LinkedIn", url: linkedinUrl },
    {
      portal: "Indeed",
      url: `https://${country}.indeed.com/jobs?q=${indeedQuery}${location ? `&l=${encodeURIComponent(location)}` : ""}`,
    },
    {
      portal: "Computrabajo",
      url: `https://www.computrabajo.${computrabajoDomain}/trabajo-de-${q}${location ? `-en-${encodeURIComponent(location)}` : ""}`,
    },
  ];
  if (country === "mx") {
    links.push({ portal: "OCC Mundial", url: `https://www.occ.com.mx/empleos/de-${q}/` });
  }
  return links;
}
