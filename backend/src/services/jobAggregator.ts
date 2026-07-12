import https from "https";
import tls from "tls";
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

// A vacancy posted months ago is very likely already filled or stale — showing it as a "real
// compatible opportunity" would be misleading, so every source is filtered to only what's actually
// recent relative to the moment of the search, not just relative to some fixed catalog snapshot.
const MAX_JOB_AGE_DAYS = 30;

function isRecent(dateStr: string | undefined, maxDays = MAX_JOB_AGE_DAYS): boolean {
  if (!dateStr) return false;
  const posted = new Date(dateStr).getTime();
  if (Number.isNaN(posted)) return false;
  const ageMs = Date.now() - posted;
  return ageMs >= 0 && ageMs <= maxDays * 24 * 60 * 60 * 1000;
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
  source: "adzuna" | "remotive" | "arbeitnow" | "jooble" | "spe";
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
      return queryMatches(haystack, query) && isRecent(j.publication_date);
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
      if (!isRecent(j.created_at ? new Date(j.created_at * 1000).toISOString() : undefined)) return false;
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
      .filter((j: NormalizedJob) => matchesModality(`${j.title} ${j.description || ""}`, opts.modality) && isRecent(j.postedAt));
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
      .filter((j: NormalizedJob) => matchesModality(`${j.title} ${j.description || ""}`, opts.modality) && isRecent(j.postedAt));
  } catch {
    return [];
  }
}

const SPE_BASE = "https://www.buscadordeempleo.gov.co/backbue/v1";

// The government site's server sends an incomplete TLS chain (missing this intermediate) — browsers
// tolerate that via cached/AIA-fetched intermediates, but Node's fetch does not, so plain fetch()
// fails here with UNABLE_TO_VERIFY_LEAF_SIGNATURE. This is the real, publicly published DigiCert/
// GeoTrust intermediate (fetched from its own AIA "CA Issuers" URL) chaining up to a root Node
// already trusts — bundling it is the correct fix, not disabling certificate verification.
const SPE_INTERMEDIATE_CA = `-----BEGIN CERTIFICATE-----
MIIEjTCCA3WgAwIBAgIQDQd4KhM/xvmlcpbhMf/ReTANBgkqhkiG9w0BAQsFADBh
MQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3
d3cuZGlnaWNlcnQuY29tMSAwHgYDVQQDExdEaWdpQ2VydCBHbG9iYWwgUm9vdCBH
MjAeFw0xNzExMDIxMjIzMzdaFw0yNzExMDIxMjIzMzdaMGAxCzAJBgNVBAYTAlVT
MRUwEwYDVQQKEwxEaWdpQ2VydCBJbmMxGTAXBgNVBAsTEHd3dy5kaWdpY2VydC5j
b20xHzAdBgNVBAMTFkdlb1RydXN0IFRMUyBSU0EgQ0EgRzEwggEiMA0GCSqGSIb3
DQEBAQUAA4IBDwAwggEKAoIBAQC+F+jsvikKy/65LWEx/TMkCDIuWegh1Ngwvm4Q
yISgP7oU5d79eoySG3vOhC3w/3jEMuipoH1fBtp7m0tTpsYbAhch4XA7rfuD6whU
gajeErLVxoiWMPkC/DnUvbgi74BJmdBiuGHQSd7LwsuXpTEGG9fYXcbTVN5SATYq
DfbexbYxTMwVJWoVb6lrBEgM3gBBqiiAiy800xu1Nq07JdCIQkBsNpFtZbIZhsDS
fzlGWP4wEmBQ3O67c+ZXkFr2DcrXBEtHam80Gp2SNhou2U5U7UesDL/xgLK6/0d7
6TnEVMSUVJkZ8VeZr+IUIlvoLrtjLbqugb0T3OYXW+CQU0kBAgMBAAGjggFAMIIB
PDAdBgNVHQ4EFgQUlE/UXYvkpOKmgP792PkA76O+AlcwHwYDVR0jBBgwFoAUTiJU
IBiV5uNu5g/6+rkS7QYXjzkwDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQGCCsG
AQUFBwMBBggrBgEFBQcDAjASBgNVHRMBAf8ECDAGAQH/AgEAMDQGCCsGAQUFBwEB
BCgwJjAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AuZGlnaWNlcnQuY29tMEIGA1Ud
HwQ7MDkwN6A1oDOGMWh0dHA6Ly9jcmwzLmRpZ2ljZXJ0LmNvbS9EaWdpQ2VydEds
b2JhbFJvb3RHMi5jcmwwPQYDVR0gBDYwNDAyBgRVHSAAMCowKAYIKwYBBQUHAgEW
HGh0dHBzOi8vd3d3LmRpZ2ljZXJ0LmNvbS9DUFMwDQYJKoZIhvcNAQELBQADggEB
AIIcBDqC6cWpyGUSXAjjAcYwsK4iiGF7KweG97i1RJz1kwZhRoo6orU1JtBYnjzB
c4+/sXmnHJk3mlPyL1xuIAt9sMeC7+vreRIF5wFBC0MCN5sbHwhNN1JzKbifNeP5
ozpZdQFmkCo+neBiKR6HqIA+LMTMCMMuv2khGGuPHmtDze4GmEGZtYLyF8EQpa5Y
jPuV6k2Cr/N3XxFpT3hRpt/3usU/Zb9wfKPtWpoznZ4/44c1p9rzFcZYrWkj3A+7
TNBJE0GmP2fhXhP1D/XVfIW/h0yCJGEiV9Glm/uGOa3DXHlmbAcxSyCRraG+ZBkA
7h4SeM6Y8l/7MBRpPCz6l8Y=
-----END CERTIFICATE-----`;

const speAgent = new https.Agent({ ca: [SPE_INTERMEDIATE_CA, ...tls.rootCertificates] });

function speFetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent: speAgent, headers: { Accept: "application/json" } }, (res) => {
      if (!res.statusCode || res.statusCode >= 400) {
        res.resume();
        reject(new Error(`SPE HTTP ${res.statusCode}`));
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(8000, () => req.destroy(new Error("SPE request timed out")));
  });
}

// Telltale bytes of UTF-8 text that got decoded as Latin-1 then re-encoded (each accented Spanish
// character turns into an "Ã"/"Â" pair). Only some of this feed's fields are affected — applying
// the fix unconditionally would instead corrupt fields that are already correctly encoded.
const MOJIBAKE_PATTERN = /[ÃÂ]/;

/**
 * Some of the feed's own text fields (mainly the long description) are mangled by a double-
 * encoding bug on their end — this best-effort repairs accented Spanish text where that's detected,
 * and always drops stray control/emoji-remnant bytes that don't render as legible Spanish.
 */
function cleanSpeText(text: string | undefined): string | undefined {
  if (!text) return text;
  let fixed = text;
  if (MOJIBAKE_PATTERN.test(text)) {
    try {
      fixed = Buffer.from(text, "latin1").toString("utf8");
    } catch {
      // keep original if the round-trip itself throws
    }
  }
  // Whatever's left of unrecoverable multi-byte sequences (mostly emoji) gets stripped here too,
  // since it falls outside this printable/Latin-1 range regardless of which branch ran above.
  return fixed
    .replace(/[^\x20-\x7E¡-ÿ\n\r]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 4000);
}

function normalizeForMatch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim();
}

let speMunicipioCache: { names: string[]; fetchedAt: number } | null = null;
const SPE_MUNICIPIO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// The MUNICIPIO filter requires an exact canonical string (e.g. "BOGOTÁ, D.C.", not "Bogota"), and
// that canonical list is only exposed as a facet on the results endpoint itself — fetched once and
// cached, since city names essentially never change within a day.
async function resolveSpeMunicipio(location: string | undefined): Promise<string | undefined> {
  if (!location) return undefined;
  try {
    if (!speMunicipioCache || Date.now() - speMunicipioCache.fetchedAt > SPE_MUNICIPIO_CACHE_TTL_MS) {
      const data = await speFetchJson(`${SPE_BASE}/vacantes/resultados?page=1`);
      const names = Array.isArray(data.total_municipios)
        ? data.total_municipios.map((m: any) => String(m.municipio))
        : [];
      speMunicipioCache = { names, fetchedAt: Date.now() };
    }
  } catch {
    // fall through to whatever's cached (possibly nothing) rather than throwing
  }
  const target = normalizeForMatch(location);
  if (!target) return undefined;
  const match = (speMunicipioCache?.names || []).find((m) => normalizeForMatch(m).includes(target));
  return match;
}

/**
 * Real, live, unauthenticated vacancy data from Colombia's official public employment service
 * ("Bolsa Única de Empleo" / Servicio Público de Empleo) — reverse-engineered from their own public
 * frontend's network calls, since there's no published API or key: this is the exact endpoint their
 * website itself calls from the browser. Colombia-only, so it's skipped for every other country.
 */
async function searchSpeColombia(query: string, country: string, opts: JobSearchOptions): Promise<NormalizedJob[]> {
  if (country !== "co") return [];
  try {
    // DESCRIPCION_VACANTE does an exact-phrase substring match server-side, not a word-overlap
    // search — passing a whole CV-derived title ("Docente de Física y Matemáticas") matches almost
    // nothing, since real postings rarely contain that literal phrase. The core role keyword alone
    // ("Docente") matches broadly (the same fix already applied to Remotive/Arbeitnow above), but on
    // its own it loses the specialty — a physics teacher would otherwise see the same generic
    // teaching postings as a psychology teacher. So: fetch broad on the role keyword (this endpoint
    // returns up to 50 per page), then re-rank client-side so postings mentioning the remaining
    // words (the specialty — "física", "matemáticas") surface first, falling back to the broader
    // set to fill out the list when nothing specialty-specific exists.
    const words = significantWords(query);
    const keyword = words[0] || query;
    const specialtyQuery = words.slice(1).join(" ");
    const params = new URLSearchParams({ page: "1", DESCRIPCION_VACANTE: keyword });
    const municipio = await resolveSpeMunicipio(opts.location);
    if (municipio) params.set("MUNICIPIO", municipio);
    if (opts.modality === "remote") params.set("TELETRABAJO", "1");
    if (opts.modality === "onsite") params.set("TELETRABAJO", "0");

    const data = await speFetchJson(`${SPE_BASE}/vacantes/resultados?${params.toString()}`);
    let jobs = (Array.isArray(data.resultados) ? data.resultados : []).filter((j: any) =>
      isRecent(j.FECHA_PUBLICACION)
    );
    if (specialtyQuery) {
      jobs = [...jobs].sort((a: any, b: any) => {
        const score = (j: any) => (queryMatches(`${j.CARGO || ""} ${j.DESCRIPCION_VACANTE || ""}`, specialtyQuery) ? 1 : 0);
        return score(b) - score(a);
      });
    }
    return jobs.slice(0, 10).map((j: any) => {
      const prestador = Array.isArray(j.DETALLES_PRESTADOR) ? j.DETALLES_PRESTADOR[0] : undefined;
      return {
        source: "spe" as const,
        externalId: String(j.CODIGO_VACANTE),
        title: cleanSpeText(j.CARGO || j.TITULO_VACANTE) || "Vacante",
        company: prestador?.NOMBRE_PRESTADOR || "Servicio Público de Empleo",
        url: prestador?.URL_DETALLE_VACANTE || "https://www.buscadordeempleo.gov.co/",
        location: j.MUNICIPIO || j.DEPARTAMENTO || "Colombia",
        tags: j.SECTOR_ECONOMICO ? [j.SECTOR_ECONOMICO] : [],
        salary: j.RANGO_SALARIAL || undefined,
        postedAt: j.FECHA_PUBLICACION,
        description: cleanSpeText(j.DESCRIPCION_VACANTE),
      };
    });
  } catch {
    return [];
  }
}

export async function searchJobs(query: string, country = "mx", opts: JobSearchOptions = {}): Promise<NormalizedJob[]> {
  const [adzuna, jooble, remotive, arbeitnow, spe] = await Promise.all([
    searchAdzuna(query, country, opts),
    searchJooble(query, opts),
    searchRemotive(query, opts),
    searchArbeitnow(query, opts),
    searchSpeColombia(query, country, opts),
  ]);
  return [...spe, ...adzuna, ...jooble, ...remotive, ...arbeitnow];
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
