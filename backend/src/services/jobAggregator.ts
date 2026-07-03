import { env, isAdzunaEnabled } from "../lib/env";

function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

export interface NormalizedJob {
  source: "adzuna" | "remotive" | "arbeitnow";
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
 */
async function searchRemotive(query: string): Promise<NormalizedJob[]> {
  try {
    const url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.jobs) ? data.jobs : [];
    return jobs.slice(0, 10).map((j: any) => ({
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
async function searchArbeitnow(query: string): Promise<NormalizedJob[]> {
  try {
    const res = await fetch("https://www.arbeitnow.com/api/job-board-api");
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.data) ? data.data : [];
    const q = query.toLowerCase();
    const filtered = jobs.filter((j: any) => {
      const haystack = `${j.title} ${(j.tags || []).join(" ")}`.toLowerCase();
      return q.length === 0 || haystack.includes(q);
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
 * Real job data for LATAM, requires free developer keys from https://developer.adzuna.com/
 */
async function searchAdzuna(query: string, country: string): Promise<NormalizedJob[]> {
  if (!isAdzunaEnabled()) return [];
  try {
    const countryCode = country || "mx";
    const url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${env.adzunaAppId}&app_key=${env.adzunaAppKey}&results_per_page=10&what=${encodeURIComponent(
      query
    )}&content-type=application/json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: any = await res.json();
    const jobs = Array.isArray(data.results) ? data.results : [];
    return jobs.map((j: any) => ({
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
    }));
  } catch {
    return [];
  }
}

export async function searchJobs(query: string, country = "mx"): Promise<NormalizedJob[]> {
  const [adzuna, remotive, arbeitnow] = await Promise.all([
    searchAdzuna(query, country),
    searchRemotive(query),
    searchArbeitnow(query),
  ]);
  return [...adzuna, ...remotive, ...arbeitnow];
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

/**
 * LinkedIn/Indeed/Computrabajo/OCC don't offer free public search APIs, so instead of
 * fabricating listings we build real, working search-result deep links on each portal.
 */
export function buildPortalSearchLinks(query: string, country = "mx"): PortalSearchLink[] {
  const q = encodeURIComponent(query);
  const countryName = COUNTRY_NAMES[country] || "México";
  const computrabajoDomain = COMPUTRABAJO_DOMAIN[country] || "com";
  const links: PortalSearchLink[] = [
    {
      portal: "LinkedIn",
      url: `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${encodeURIComponent(countryName)}`,
    },
    {
      portal: "Indeed",
      url: `https://${country}.indeed.com/jobs?q=${q}`,
    },
    {
      portal: "Computrabajo",
      url: `https://www.computrabajo.${computrabajoDomain}/trabajo-de-${q}`,
    },
  ];
  if (country === "mx") {
    links.push({ portal: "OCC Mundial", url: `https://www.occ.com.mx/empleos/de-${q}/` });
  }
  return links;
}
