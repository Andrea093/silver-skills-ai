// Shared accent-insensitive text matching — Spanish keyword lists and free-text CV/experience
// answers frequently differ only by accents ("psicólogo" vs a keyword written as "psicolog"), and a
// plain lowercased substring match misses those. Stripping combining diacritics after NFD
// normalization makes "clínica"/"clinica" and "psicólogo"/"psicologo" match identically.

export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normalizeForMatch(s: string): string {
  return stripAccents(s).toLowerCase();
}
