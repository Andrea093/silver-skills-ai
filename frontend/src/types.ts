export interface AuthUser {
  id: string;
  name: string;
  email: string;
  employabilityScore: number | null;
  hasProfile: boolean;
  role: "user" | "admin";
  isPremium: boolean;
}

export interface Skill {
  name: string;
  level: number;
}

export interface CvAnalysisResult {
  id: string;
  filename: string;
  extractedSkills: string[];
  atsScore: number;
  suggestions: string[];
  professionLabel: string;
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
  ageFriendly?: boolean;
}

export interface PortalSearchLink {
  portal: string;
  url: string;
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  isFree: boolean | null;
  priceLabel: string;
  durationWeeks?: number;
  level?: string;
  rating?: number;
  studentsCount?: number;
  tags: string[];
  category?: string;
  featured?: boolean;
  isSearchLink?: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  weeks: number;
  tags: string[];
  courses: Course[];
  recommended?: boolean;
}

export interface MentorCard {
  type: "job" | "course" | "portal-links";
  data: any;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  cards: MentorCard[];
  createdAt: string;
}

export type Modality = "remote" | "hybrid" | "onsite" | "any";

export type PensionRegime = "rpm" | "rais" | "unknown";
export type PensionScenario = "same" | "formalize" | "change_sector" | "voluntary_contributions";

export interface PensionInputPayload {
  age: number;
  weeksContributed?: number;
  yearsWorkedEstimate?: number;
  currentIncome: number;
  regime: PensionRegime;
  scenario: PensionScenario;
}

export interface PensionAmount {
  amount: number;
  low: number;
  high: number;
}

export interface PensionProjectionResult {
  weeksContributedUsed: number;
  baseline: PensionAmount;
  scenario: PensionAmount;
  scenarioDeltaPct: number;
  recommendation: string;
}

export interface PensionResponse {
  id: string;
  input: PensionInputPayload;
  projection: PensionProjectionResult;
  createdAt?: string;
}
