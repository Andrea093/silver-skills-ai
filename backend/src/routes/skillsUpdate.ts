import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/requireAuth";
import { detectProfession, detectSpecialty, GENERAL_PROFILE, ProfessionProfile } from "../data/professionProfiles";
import { parseCvSections } from "../services/cvParser";
import { dedupeCaseInsensitive } from "../services/cvGenerator";
import { searchCoursesByTopic } from "../services/courseCatalog";

export const skillsUpdateRouter = Router();

const MAX_ENRICHED_GAPS = 6;

// A generic keyword search on a consumer MOOC platform frequently has no real course on a niche,
// specific disciplinary term (e.g. LinkedIn Learning has no matches at all for "Auditoría interna";
// Coursera's fuzzy search for "Mecánica clásica" surfaces unrelated results like sports marketing).
// Funneling the user to a single provider means a dead-end search *feels* like a broken link, even
// though the URL itself is real and loads. Offering several real search links instead of one gives
// a genuine second/third chance without ever fabricating course content.
const MAX_SEARCH_LINK_OPTIONS = 3;

async function buildGapAnalysis(targetSkills: string[], ownedLower: Set<string>) {
  const owned = targetSkills.filter((name) => ownedLower.has(name.toLowerCase()));
  const allGaps = targetSkills.filter((name) => !ownedLower.has(name.toLowerCase()));
  const gapsToEnrich = allGaps.slice(0, MAX_ENRICHED_GAPS);
  const gaps = await Promise.all(
    gapsToEnrich.map(async (skill) => {
      const matches = await searchCoursesByTopic(skill);
      const isSearchFallback = matches.length > 0 && matches[0].isSearchLink;
      return {
        skill,
        resources: isSearchFallback ? matches.slice(0, MAX_SEARCH_LINK_OPTIONS) : matches.slice(0, 1),
      };
    })
  );
  return { owned, gaps, totalGapsCount: allGaps.length };
}

skillsUpdateRouter.get("/", requireAuth, async (req, res) => {
  const skills = await prisma.skill.findMany({ where: { userId: req.userId! } });
  const latestCv = await prisma.cvAnalysis.findFirst({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
  });
  const hasProfile = skills.length > 0 || Boolean(latestCv);

  if (!hasProfile) {
    return res.json({ hasProfile: false });
  }

  // Same profession-detection precedence used by transition.ts: prefer the CV's own text/headline,
  // fall back to the latest assessment's free-text experience answer, else the general profile.
  let profile: ProfessionProfile;
  let rawText = "";
  let headline: string | undefined;
  if (latestCv) {
    const parsed = parseCvSections(latestCv.rawText);
    rawText = latestCv.rawText;
    headline = parsed.headline;
    profile = detectProfession(rawText, headline);
  } else {
    const latestAssessment = await prisma.assessment.findFirst({
      where: { userId: req.userId! },
      orderBy: { createdAt: "desc" },
    });
    const answers = latestAssessment ? JSON.parse(latestAssessment.answers) : null;
    rawText = answers?.experienceText || "";
    profile = rawText ? detectProfession(rawText) : GENERAL_PROFILE;
  }

  // A skill saved at the 35 "undetected" floor isn't real evidence of ownership — only count skills
  // the person actually showed some confidence in (same >=50 threshold already used elsewhere in
  // the app, e.g. cvGenerator.ts's mergePlatformSkills) as "ya dominas".
  const ownedLower = new Set(skills.filter((s) => s.level >= 50).map((s) => s.name.toLowerCase()));

  // Dimension 1: general/role skills — how you do the job, common to anyone in the profession.
  const generalTargetSkills = dedupeCaseInsensitive([...profile.atsKeywords, ...profile.century21Skills]);
  const general = await buildGapAnalysis(generalTargetSkills, ownedLower);

  // Dimension 2: disciplinary/specialty knowledge — what you specifically know (e.g. "Física"
  // within "Educación"). Only present when a specialty is actually detected — never forced.
  const specialty = detectSpecialty(profile, rawText, headline);
  const disciplinary = specialty
    ? await buildGapAnalysis(dedupeCaseInsensitive(specialty.disciplinarySkills), ownedLower)
    : null;

  res.json({
    hasProfile: true,
    professionId: profile.id,
    professionLabel: profile.label,
    owned: general.owned,
    gaps: general.gaps,
    totalGapsCount: general.totalGapsCount,
    specialtyId: specialty?.id ?? null,
    specialtyLabel: specialty?.label ?? null,
    disciplinaryOwned: disciplinary?.owned ?? null,
    disciplinaryGaps: disciplinary?.gaps ?? null,
    disciplinaryTotalGapsCount: disciplinary?.totalGapsCount ?? null,
  });
});
