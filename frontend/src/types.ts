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
