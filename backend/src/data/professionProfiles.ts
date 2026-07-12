// Profession taxonomy used to make the generated/analyzed CV differ meaningfully by profile
// instead of applying one generic template to everyone. Categories are intentionally broad
// (LATAM-relevant occupations), not an exhaustive classification system.

export interface ProfessionProfile {
  id: string;
  label: string;
  matchKeywords: string[];
  experienceSectionLabel: string;
  atsKeywords: string[];
  century21Skills: string[];
}

// Curated from the well-known P21 ("Framework for 21st Century Learning") and OECD Learning
// Compass 2030 competency lists — not invented. Kept as short, resume-friendly phrases.
const CORE_CENTURY21_SKILLS = [
  "Pensamiento crítico",
  "Resolución de problemas complejos",
  "Colaboración en equipos multiculturales",
  "Comunicación efectiva",
  "Alfabetización digital",
  "Creatividad e innovación",
  "Adaptabilidad al cambio",
  "Aprendizaje continuo (lifelong learning)",
  "Gestión de la información",
];

export const PROFESSION_PROFILES: ProfessionProfile[] = [
  {
    id: "educacion",
    label: "Educación y Docencia",
    matchKeywords: [
      "docente", "profesor", "profesora", "maestro", "maestra", "licenciado en educación",
      "licenciada en educación", "pedagog", "enseñanza", "aula", "estudiantes", "curricular",
      "didáctica", "colegio", "escuela", "educativ",
    ],
    experienceSectionLabel: "Experiencia Docente",
    atsKeywords: [
      "Planeación curricular", "Evaluación por competencias", "Aprendizaje Basado en Proyectos (ABP)",
      "Aprendizaje Basado en Juegos (ABJ)", "Gestión de aula", "Metodologías activas de aprendizaje",
      "Diseño instruccional", "TIC en educación", "Pruebas estandarizadas", "Acompañamiento académico",
    ],
    century21Skills: ["Aprendizaje continuo (lifelong learning)", "Alfabetización digital", "Creatividad e innovación", "Comunicación efectiva"],
  },
  {
    id: "salud",
    label: "Salud",
    matchKeywords: [
      "médico", "médica", "enfermero", "enfermera", "clínic", "paciente", "hospital", "salud",
      "terapia", "odontolog", "psicolog", "farmacéutic", "diagnóstico",
    ],
    experienceSectionLabel: "Experiencia Clínica",
    atsKeywords: [
      "Atención al paciente", "Historia clínica", "Protocolos de bioseguridad", "Trabajo interdisciplinario",
      "Manejo de urgencias", "Educación en salud", "Normatividad sanitaria",
    ],
    century21Skills: ["Resolución de problemas complejos", "Comunicación efectiva", "Colaboración en equipos multiculturales", "Adaptabilidad al cambio"],
  },
  {
    id: "contabilidad-finanzas",
    label: "Contabilidad y Finanzas",
    matchKeywords: [
      "contador", "contable", "contaduría", "financiero", "finanzas", "niif", "auditor", "tesorer",
      "impuestos", "conciliación", "estados financieros", "presupuesto",
    ],
    experienceSectionLabel: "Experiencia en Contabilidad y Finanzas",
    atsKeywords: [
      "NIIF", "Conciliación bancaria", "Estados financieros", "Análisis de costos", "Auditoría interna",
      "Declaración de impuestos", "Presupuesto y flujo de caja", "Excel avanzado", "Software contable (SAP/Siigo)",
    ],
    century21Skills: ["Pensamiento crítico", "Gestión de la información", "Alfabetización digital", "Resolución de problemas complejos"],
  },
  {
    id: "ingenieria-tecnologia",
    label: "Ingeniería y Tecnología",
    matchKeywords: [
      "ingeniero", "ingeniera", "desarrollador", "desarrolladora", "software", "programación",
      "sistemas", "ti ", "tecnología", "datos", "devops", "arquitectura de software", "backend", "frontend",
    ],
    experienceSectionLabel: "Experiencia Técnica",
    atsKeywords: [
      "Desarrollo de software", "Metodologías ágiles (Scrum)", "Control de versiones (Git)",
      "Bases de datos", "Automatización de procesos", "Integración de sistemas", "Análisis de requerimientos",
    ],
    century21Skills: ["Resolución de problemas complejos", "Pensamiento crítico", "Alfabetización digital", "Aprendizaje continuo (lifelong learning)"],
  },
  {
    id: "ventas-comercial",
    label: "Ventas y Comercial",
    matchKeywords: [
      "ventas", "comercial", "asesor comercial", "vendedor", "cliente", "cartera de clientes",
      "negociación", "cotización", "cierre de ventas", "kpi de ventas",
    ],
    experienceSectionLabel: "Experiencia Comercial",
    atsKeywords: [
      "Prospección de clientes", "Negociación y cierre", "Gestión de cartera", "Metas de ventas",
      "CRM", "Fidelización de clientes", "Presentaciones comerciales",
    ],
    century21Skills: ["Comunicación efectiva", "Adaptabilidad al cambio", "Colaboración en equipos multiculturales", "Creatividad e innovación"],
  },
  {
    id: "administracion-rrhh",
    label: "Administración y Recursos Humanos",
    matchKeywords: [
      "recursos humanos", "talento humano", "administrativ", "nómina", "reclutamiento", "selección de personal",
      "gestión humana", "bienestar laboral", "capacitación de personal",
    ],
    experienceSectionLabel: "Experiencia en Gestión Humana",
    atsKeywords: [
      "Reclutamiento y selección", "Gestión de nómina", "Clima organizacional", "Capacitación y desarrollo",
      "Normatividad laboral", "Evaluación de desempeño",
    ],
    century21Skills: ["Comunicación efectiva", "Colaboración en equipos multiculturales", "Gestión de la información", "Adaptabilidad al cambio"],
  },
  {
    id: "marketing-comunicaciones",
    label: "Marketing y Comunicaciones",
    matchKeywords: [
      "marketing", "mercadeo", "comunicaciones", "redes sociales", "contenido digital", "publicidad",
      "marca", "branding", "community manager",
    ],
    experienceSectionLabel: "Experiencia en Marketing",
    atsKeywords: [
      "Estrategia de contenido", "Redes sociales", "SEO/SEM", "Analítica digital", "Gestión de marca",
      "Campañas publicitarias", "Marketing digital",
    ],
    century21Skills: ["Creatividad e innovación", "Alfabetización digital", "Comunicación efectiva", "Pensamiento crítico"],
  },
  {
    id: "operaciones-logistica",
    label: "Operaciones y Logística",
    matchKeywords: [
      "logística", "operaciones", "cadena de suministro", "inventario", "almacén", "transporte",
      "distribución", "producción",
    ],
    experienceSectionLabel: "Experiencia en Operaciones y Logística",
    atsKeywords: [
      "Gestión de inventarios", "Cadena de suministro", "Optimización de procesos", "Control de calidad",
      "Planeación logística", "Indicadores de gestión (KPI)",
    ],
    century21Skills: ["Resolución de problemas complejos", "Gestión de la información", "Adaptabilidad al cambio", "Colaboración en equipos multiculturales"],
  },
  {
    id: "legal",
    label: "Legal y Jurídico",
    matchKeywords: [
      "abogad", "jurídic", "derecho", "litigio", "contrato", "notarial", "legal ", "cumplimiento normativo",
    ],
    experienceSectionLabel: "Experiencia Jurídica",
    atsKeywords: [
      "Redacción de contratos", "Litigio", "Cumplimiento normativo", "Asesoría legal", "Derecho corporativo",
    ],
    century21Skills: ["Pensamiento crítico", "Comunicación efectiva", "Gestión de la información", "Resolución de problemas complejos"],
  },
];

export const GENERAL_PROFILE: ProfessionProfile = {
  id: "general",
  label: "Perfil Profesional General",
  matchKeywords: [],
  experienceSectionLabel: "Experiencia Profesional",
  atsKeywords: ["Trabajo en equipo", "Orientación a resultados", "Comunicación", "Organización"],
  century21Skills: CORE_CENTURY21_SKILLS.slice(0, 4),
};

export const CENTURY21_SKILLS = CORE_CENTURY21_SKILLS;

export function detectProfession(rawText: string, headline?: string): ProfessionProfile {
  const haystack = `${headline || ""} ${rawText}`.toLowerCase();

  let best: { profile: ProfessionProfile; score: number } | null = null;
  for (const profile of PROFESSION_PROFILES) {
    const score = profile.matchKeywords.reduce(
      (sum, kw) => sum + (haystack.includes(kw.toLowerCase()) ? 1 : 0),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { profile, score };
    }
  }

  return best ? best.profile : GENERAL_PROFILE;
}
