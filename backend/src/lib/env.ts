import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || undefined,
  adzunaAppId: process.env.ADZUNA_APP_ID || undefined,
  adzunaAppKey: process.env.ADZUNA_APP_KEY || undefined,
  joobleApiKey: process.env.JOOBLE_API_KEY || undefined,
};

export const isMentorAgentEnabled = () => Boolean(env.anthropicApiKey);
export const isAdzunaEnabled = () => Boolean(env.adzunaAppId && env.adzunaAppKey);
export const isJoobleEnabled = () => Boolean(env.joobleApiKey);
