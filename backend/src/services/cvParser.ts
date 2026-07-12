// Best-effort structural parser for plain-text CVs (extracted from PDF/DOCX upstream). Real resume
// parsing is a hard NLP problem; this targets the common Spanish/English resume convention seen in
// LATAM CVs — standalone section headers, then for "experiencia" repeating blocks of
// (institution, role, date-range, bullet achievements) — and always degrades gracefully to a
// single catch-all entry when the text doesn't match, so the CV generator never breaks on an
// unusual layout.

export interface ParsedExperienceEntry {
  company: string;
  role: string;
  dates: string;
  bullets: string[];
}

export interface ParsedCv {
  headline?: string;
  profileSummary: string;
  experience: ParsedExperienceEntry[];
  education: string[];
  courses: string[];
  skillsLine: string;
}

type SectionKey = "profile" | "experience" | "education" | "courses" | "skills";

const SECTION_PATTERNS: Record<SectionKey, RegExp> = {
  profile: /^(perfil profesional|resumen profesional|resumen|acerca de m[ií]|about me|professional summary|objetivo profesional|summary)$/i,
  experience: /^(experiencia laboral|experiencia profesional|experiencia|trayectoria profesional|work experience|professional experience)$/i,
  education: /^(formaci[oó]n acad[eé]mica|educaci[oó]n|estudios|education)$/i,
  courses: /^(cursos( y certificaciones)?|certificaciones|certifications)$/i,
  skills: /^(habilidades( clave)?|competencias( clave)?|skills|competencias)$/i,
};

const DATE_RANGE_RE =
  /(?:[A-Za-zÁÉÍÓÚáéíóú]{3,}\.?\s+\d{4}|(?:19|20)\d{2})\s*[-–—]\s*(?:[A-Za-zÁÉÍÓÚáéíóú]{3,}\.?\s+\d{4}|(?:19|20)\d{2}|actualidad|presente|hoy|en finalizaci[oó]n)/i;

const BULLET_RE = /^[•▪◦●○*-]\s*/;

function isBulletLine(line: string): boolean {
  return BULLET_RE.test(line);
}

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, "").trim();
}

function isDateRangeLine(line: string): boolean {
  return !isBulletLine(line) && DATE_RANGE_RE.test(line);
}

function classifyHeader(line: string): SectionKey | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return null;
  for (const key of Object.keys(SECTION_PATTERNS) as SectionKey[]) {
    if (SECTION_PATTERNS[key].test(trimmed)) return key;
  }
  return null;
}

function looksLikeContactLine(line: string): boolean {
  const digits = (line.match(/\d/g) || []).length;
  return /@/.test(line) || digits >= 6;
}

/** Splits raw CV text into a header block plus named sections, by scanning for standalone header lines. */
function splitSections(lines: string[]): { headerLines: string[]; sections: Partial<Record<SectionKey, string[]>> } {
  const sections: Partial<Record<SectionKey, string[]>> = {};
  let current: SectionKey | null = null;
  const headerLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const key = classifyHeader(line);
    if (key) {
      current = key;
      if (!sections[key]) sections[key] = [];
      continue;
    }
    if (current) {
      sections[current]!.push(line);
    } else {
      headerLines.push(line);
    }
  }

  return { headerLines, sections };
}

function parseExperienceEntries(lines: string[]): ParsedExperienceEntry[] {
  if (lines.length === 0) return [];

  const dateIndexes: number[] = [];
  lines.forEach((line, i) => {
    if (isDateRangeLine(line)) dateIndexes.push(i);
  });

  // No recognizable date-range pattern: fall back to a single catch-all block rather than losing content.
  if (dateIndexes.length === 0) {
    return [{ company: "", role: "", dates: "", bullets: lines.map(stripBullet) }];
  }

  const entries: ParsedExperienceEntry[] = [];
  let cursor = 0;

  dateIndexes.forEach((dateIdx, i) => {
    // Header lines for this entry: the non-bullet lines between `cursor` and `dateIdx`.
    const headerCandidates = lines.slice(cursor, dateIdx).filter((l) => !isBulletLine(l));
    // Anything before those last (up to 2) header lines is stray text — attach it to the previous
    // entry's bullets instead of discarding it.
    const strayCount = Math.max(0, headerCandidates.length - 2);
    if (strayCount > 0 && entries.length > 0) {
      entries[entries.length - 1].bullets.push(...headerCandidates.slice(0, strayCount).map(stripBullet));
    }
    const headerLines = headerCandidates.slice(-2);
    const [company, role] =
      headerLines.length === 2 ? headerLines : headerLines.length === 1 ? [headerLines[0], ""] : ["", ""];

    const nextBoundary = i + 1 < dateIndexes.length ? findHeaderStart(lines, dateIdx + 1, dateIndexes[i + 1]) : lines.length;
    const bullets = lines
      .slice(dateIdx + 1, nextBoundary)
      .filter(Boolean)
      .map(stripBullet);

    entries.push({ company, role, dates: lines[dateIdx].trim(), bullets });
    cursor = nextBoundary;
  });

  return entries;
}

/** Finds where the next entry's header lines start (up to 2 non-bullet lines right before the next date line). */
function findHeaderStart(lines: string[], from: number, nextDateIdx: number): number {
  const candidates: number[] = [];
  for (let i = from; i < nextDateIdx; i++) {
    if (!isBulletLine(lines[i])) candidates.push(i);
  }
  if (candidates.length === 0) return nextDateIdx;
  return candidates[Math.max(0, candidates.length - 2)];
}

export function parseCvSections(rawText: string): ParsedCv {
  const lines = rawText.split(/\r?\n/);
  const { headerLines, sections } = splitSections(lines);

  // Headline: first header-block line that isn't the name (first line) and isn't clearly a
  // phone/email/location line.
  const headline = headerLines.slice(1).find((l) => !looksLikeContactLine(l) && !/,/.test(l));

  const profileSummary = (sections.profile || []).join(" ").trim();
  const experience = parseExperienceEntries(sections.experience || []);
  const education = (sections.education || []).filter(Boolean);
  const courses = (sections.courses || []).filter(Boolean);
  const skillsLine = (sections.skills || []).map(stripBullet).join(", ");

  return { headline, profileSummary, experience, education, courses, skillsLine };
}
