import Anthropic from "@anthropic-ai/sdk";
import { env, isMentorAgentEnabled } from "../lib/env";
import { buildPortalSearchLinks, searchJobs, Modality } from "./jobAggregator";
import { searchCoursesByTopic } from "./courseCatalog";

export interface MentorCard {
  type: "job" | "course" | "portal-links";
  data: any;
}

export interface MentorReply {
  message: string;
  cards: MentorCard[];
}

interface UserProfileForMentor {
  name: string;
  employabilityScore: number;
  skills: { name: string; level: number }[];
  country: string;
  location?: string;
  modality?: Modality;
}

const tools: Anthropic.Tool[] = [
  {
    name: "search_jobs",
    description:
      "Busca vacantes de empleo reales para un rol o habilidad, combinando fuentes reales (Remotive, Arbeitnow, Adzuna si está configurado) y enlaces de búsqueda directa en LinkedIn/Indeed/Computrabajo. Úsala siempre que el usuario pregunte por empleos, vacantes u oportunidades.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Rol o palabra clave a buscar, ej. 'consultor digital'" },
        country: { type: "string", description: "Código de país ISO2 en minúsculas, ej. mx, co, ar, cl, pe, br" },
        location: { type: "string", description: "Ciudad, ej. 'Bogotá' — usa la del perfil del usuario si la tiene" },
        modality: { type: "string", enum: ["remote", "hybrid", "onsite", "any"], description: "Modalidad de trabajo preferida" },
      },
      required: ["query"],
    },
  },
  {
    name: "search_courses",
    description:
      "Busca cursos reales (gratuitos o de pago) sobre un tema, del catálogo curado de la plataforma o, si no hay match, enlaces de búsqueda reales en Coursera/Udemy/edX/LinkedIn Learning. Úsala siempre que el usuario pida recomendaciones de cursos o rutas de aprendizaje.",
    input_schema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Tema o habilidad a buscar, ej. 'marketing digital'" },
      },
      required: ["topic"],
    },
  },
];

async function executeTool(name: string, input: any, profile: UserProfileForMentor) {
  if (name === "search_jobs") {
    const country = input.country || profile.country;
    const location = input.location || profile.location;
    const modality = input.modality || profile.modality || "any";
    const jobs = await searchJobs(input.query, country, { location, modality });
    const portalLinks = buildPortalSearchLinks(input.query, country, location, modality);
    return { jobs: jobs.slice(0, 6), portalLinks };
  }
  if (name === "search_courses") {
    const courses = await searchCoursesByTopic(input.topic);
    return { courses };
  }
  return { error: "unknown tool" };
}

const SYSTEM_PROMPT = (profile: UserProfileForMentor) => `Eres el "Mentor IA" de Silver Skills AI, una plataforma que ayuda a adultos de 50+ años en Latinoamérica a reinventarse profesionalmente antes o durante su transición a la jubilación. Hablas en español, con un tono cálido, motivador y directo.

Perfil del usuario actual:
- Nombre: ${profile.name}
- Índice de empleabilidad: ${profile.employabilityScore}%
- Habilidades: ${profile.skills.map((s) => `${s.name} (${s.level}%)`).join(", ") || "sin evaluar aún"}
- País: ${profile.country}${profile.location ? `\n- Ciudad preferida: ${profile.location}` : ""}${
  profile.modality && profile.modality !== "any" ? `\n- Modalidad preferida: ${profile.modality}` : ""
}

Cuando el usuario pregunte por vacantes, empleos u oportunidades laborales, SIEMPRE usa la herramienta search_jobs antes de responder — nunca inventes vacantes ni empresas.
Cuando el usuario pida cursos, rutas de aprendizaje o cómo mejorar una habilidad, SIEMPRE usa search_courses antes de responder — nunca inventes cursos ni links.
Al final de tu respuesta en texto, resume brevemente y concreto qué encontraste, mencionando que el usuario puede ver los detalles y enlaces reales en las tarjetas mostradas debajo de tu mensaje.`;

export async function runMentorAgent(
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
  profile: UserProfileForMentor
): Promise<MentorReply> {
  if (!isMentorAgentEnabled()) {
    return runFallbackMentor(userMessage, profile);
  }

  const client = new Anthropic({ apiKey: env.anthropicApiKey });
  const cards: MentorCard[] = [];

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  for (let turn = 0; turn < 4; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT(profile),
      tools,
      messages,
    });

    const toolUses = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");

    if (toolUses.length === 0) {
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { message: text, cards };
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      const result = await executeTool(toolUse.name, toolUse.input, profile);
      if (toolUse.name === "search_jobs") {
        cards.push({ type: "job", data: result });
      } else if (toolUse.name === "search_courses") {
        cards.push({ type: "course", data: result });
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    message: "Encontré varias opciones para ti, revisa las tarjetas debajo de este mensaje.",
    cards,
  };
}

async function runFallbackMentor(userMessage: string, profile: UserProfileForMentor): Promise<MentorReply> {
  const lower = userMessage.toLowerCase();
  const cards: MentorCard[] = [];
  const firstName = profile.name.split(" ")[0];
  const hasProfile = profile.skills.length > 0;
  let message: string;

  const wantsJobs = /(empleo|vacante|trabajo|oportunidad|contrat)/.test(lower);
  const wantsCourses = /(curso|aprender|capacitaci|formaci|estudiar)/.test(lower);
  const wantsProgress = /(progreso|plan de desarrollo|mi plan|estadistic|estadíst)/.test(lower);
  const wantsGoals = /(meta|objetivo)/.test(lower);
  const wantsCareerAdvice = /(consejo|orientaci|carrera|empleabilidad|mejorar mi|c[oó]mo mejoro)/.test(lower);
  const isGreeting = /^\s*(hola|buenas|hey|qu[eé] tal|buenos d[ií]as|buenas tardes|buenas noches)/.test(lower);
  const isThanks = /gracias/.test(lower);

  if (!hasProfile && (wantsJobs || wantsCourses || wantsProgress || wantsGoals || wantsCareerAdvice)) {
    // Every one of these needs at least one real skill to personalize around — without that we'd
    // otherwise fall back to a generic, made-up skill, which is exactly what shouldn't happen.
    message = `Para responder eso necesito conocer tu perfil primero. Completa la Evaluación (menú "Evaluación") o sube tu CV en "Transición" — con eso puedo buscarte vacantes y cursos reales que sí apliquen a ti, en vez de darte algo genérico.`;
  } else if (wantsJobs) {
    const topSkill = profile.skills.sort((a, b) => b.level - a.level)[0].name;
    const jobs = await searchJobs(topSkill, profile.country, { location: profile.location, modality: profile.modality });
    const portalLinks = buildPortalSearchLinks(topSkill, profile.country, profile.location, profile.modality);
    cards.push({ type: "job", data: { jobs: jobs.slice(0, 6), portalLinks } });
    message = `Basado en tu habilidad más fuerte (${topSkill}), encontré vacantes reales y enlaces de búsqueda directa en los portales principales. Revisa las tarjetas debajo.`;
  } else if (wantsCourses) {
    const weakest = profile.skills.sort((a, b) => a.level - b.level)[0];
    const topic = /marketing/.test(lower)
      ? "marketing digital"
      : /ia|inteligencia/.test(lower)
      ? "inteligencia artificial"
      : /excel|dato/.test(lower)
      ? "análisis de datos"
      : weakest.name;
    const courses = await searchCoursesByTopic(topic);
    cards.push({ type: "course", data: { courses } });
    message = `Te recomiendo empezar por "${topic}"${
      topic === weakest.name ? " — es donde tu evaluación mostró más oportunidad de mejora" : ""
    }. Aquí tienes cursos reales, gratuitos y de pago, con enlace directo.`;
  } else if (wantsProgress) {
    const summary = profile.skills.map((s) => `${s.name}: ${s.level}%`).join(", ");
    message = hasProfile
      ? `Tu índice de empleabilidad actual es ${profile.employabilityScore}%. Tus habilidades registradas son: ${summary}. Pregúntame "recomiéndame cursos" para saber en qué enfocarte para subirlo.`
      : `Aún no tienes una evaluación registrada, así que no tengo progreso que mostrarte todavía. Completa la Evaluación para empezar a medirlo.`;
  } else if (wantsGoals) {
    message = `Puedo ayudarte a definir metas concretas una vez conozca tu perfil. Ve a "Evaluación" y cuéntame tus intereses y disponibilidad semanal — con eso te sugiero una ruta de aprendizaje realista.`;
  } else if (wantsCareerAdvice) {
    const weakest = profile.skills.sort((a, b) => a.level - b.level)[0];
    message = `Para subir tu empleabilidad, lo más efectivo suele ser reforzar tu habilidad más débil (${weakest.name}, ${weakest.level}%) con un curso corto y aplicarla en una vacante real cuanto antes. Pregúntame "recomiéndame cursos" o "muéstrame vacantes" y te muestro opciones reales.`;
  } else if (isThanks) {
    message = `¡Con gusto, ${firstName}! Si quieres seguir avanzando, pregúntame por vacantes o cursos cuando quieras.`;
  } else if (isGreeting) {
    message = `¡Hola ${firstName}! ¿En qué te ayudo hoy? Puedo buscarte vacantes reales, recomendarte cursos, o darte consejos de carrera según tu evaluación.`;
  } else {
    message = `No estoy seguro de haber entendido bien tu pregunta (estoy en modo asistido, sin IA generativa activada). Puedo ayudarte con algo concreto: vacantes reales, cursos reales, tu progreso, o consejos de carrera — dime cuál te interesa.`;
  }

  return { message, cards };
}
