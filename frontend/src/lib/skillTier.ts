// Turns a raw 0-100 skill level into a consistent color/label tier, reused everywhere a skill list
// is rendered (Evaluación results, Dashboard) so the person can tell at a glance what's strong vs.
// what to work on, instead of scanning a flat list of percentages.
export interface SkillTier {
  label: string;
  badgeTone: "success" | "accent" | "neutral";
  barColorClass: string;
}

export function skillTier(level: number): SkillTier {
  if (level >= 75) return { label: "Fuerte", badgeTone: "success", barColorClass: "bg-emerald-600" };
  if (level >= 50) return { label: "En desarrollo", badgeTone: "accent", barColorClass: "bg-amber-500" };
  return { label: "Por fortalecer", badgeTone: "neutral", barColorClass: "bg-rose-500" };
}

export function sortSkillsByLevelDesc<T extends { level: number }>(skills: T[]): T[] {
  return [...skills].sort((a, b) => b.level - a.level);
}
