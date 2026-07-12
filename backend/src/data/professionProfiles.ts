// Profession taxonomy used to make the generated/analyzed CV differ meaningfully by profile
// instead of applying one generic template to everyone. Categories are intentionally broad
// (LATAM-relevant occupations), not an exhaustive classification system.

import { normalizeForMatch } from "../lib/textNormalize";

export interface Specialty {
  id: string;
  label: string;
  matchKeywords: string[];
  disciplinarySkills: string[];
}

export interface ProfessionProfile {
  id: string;
  label: string;
  matchKeywords: string[];
  experienceSectionLabel: string;
  atsKeywords: string[];
  century21Skills: string[];
  // Subject-matter/disciplinary specialties within this profession — e.g. within "Educación",
  // a teacher's subject (Física, Matemáticas...). Distinct from atsKeywords, which cover the
  // *general* role skills common to anyone in the profession (how you teach, not what you teach).
  specialties?: Specialty[];
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
    specialties: [
      {
        id: "fisica",
        label: "Física",
        matchKeywords: ["física", "mecánica", "electromagnetismo", "termodinámica", "óptica"],
        disciplinarySkills: ["Mecánica clásica", "Electromagnetismo", "Termodinámica", "Física experimental y de laboratorio", "Resolución de problemas de física"],
      },
      {
        id: "matematicas",
        label: "Matemáticas",
        matchKeywords: ["matemáticas", "álgebra", "cálculo", "geometría", "trigonometría", "estadística"],
        disciplinarySkills: ["Álgebra", "Cálculo diferencial e integral", "Geometría", "Estadística y probabilidad", "Pensamiento lógico-matemático"],
      },
      {
        id: "quimica",
        label: "Química",
        matchKeywords: ["química", "químic"],
        disciplinarySkills: ["Química general", "Química orgánica", "Laboratorio de química", "Estequiometría"],
      },
      {
        id: "ciencias-naturales",
        label: "Biología y Ciencias Naturales",
        matchKeywords: ["biología", "ciencias naturales", "biológ"],
        disciplinarySkills: ["Biología celular", "Ecología", "Ciencias naturales", "Laboratorio de ciencias"],
      },
      {
        id: "lengua-castellana",
        label: "Lengua Castellana y Literatura",
        matchKeywords: ["lengua castellana", "literatura", "español", "lectura crítica", "comprensión lectora"],
        disciplinarySkills: ["Comprensión lectora", "Producción textual", "Análisis literario", "Ortografía y redacción"],
      },
      {
        id: "ciencias-sociales",
        label: "Ciencias Sociales e Historia",
        matchKeywords: ["ciencias sociales", "historia", "geografía", "cátedra de paz"],
        disciplinarySkills: ["Historia", "Geografía", "Análisis de procesos sociales", "Cátedra de paz"],
      },
      {
        id: "idiomas",
        label: "Inglés y Otros Idiomas",
        matchKeywords: ["inglés", "idiomas", "bilingüe", "segunda lengua", "toefl", "esl"],
        disciplinarySkills: ["Gramática del idioma", "Comprensión auditiva y oral", "Metodología de enseñanza de idiomas (CLIL/TEFL)", "Certificación de dominio del idioma"],
      },
      {
        id: "educacion-fisica",
        label: "Educación Física",
        matchKeywords: ["educación física", "deporte", "recreación", "entrenador"],
        disciplinarySkills: ["Desarrollo psicomotor", "Educación física y deporte", "Planeación de actividad física", "Primeros auxilios deportivos"],
      },
      {
        id: "artes",
        label: "Artes",
        matchKeywords: ["artes", "música", "dibujo", "artístic"],
        disciplinarySkills: ["Educación artística", "Expresión plástica", "Apreciación estética", "Técnicas artísticas"],
      },
      {
        id: "informatica-escolar",
        label: "Informática y Tecnología",
        matchKeywords: ["informática", "tecnología e informática", "ofimática"],
        disciplinarySkills: ["Programación básica para educación", "Ofimática", "Robótica educativa", "Pensamiento computacional"],
      },
    ],
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
    specialties: [
      {
        id: "medicina-general",
        label: "Medicina General",
        matchKeywords: ["médico general", "medicina general", "medicina interna"],
        disciplinarySkills: ["Diagnóstico clínico", "Semiología", "Farmacología clínica", "Manejo de patologías comunes"],
      },
      {
        id: "enfermeria",
        label: "Enfermería",
        matchKeywords: ["enfermer"],
        disciplinarySkills: ["Cuidado de enfermería", "Administración de medicamentos", "Control de signos vitales", "Procedimientos de enfermería"],
      },
      {
        id: "psicologia-clinica",
        label: "Psicología Clínica",
        matchKeywords: ["psicolog", "psicoterapia", "salud mental"],
        disciplinarySkills: ["Evaluación psicológica", "Psicoterapia", "Intervención en crisis", "Psicodiagnóstico"],
      },
      {
        id: "odontologia",
        label: "Odontología",
        matchKeywords: ["odontolog", "dental"],
        disciplinarySkills: ["Procedimientos odontológicos", "Endodoncia", "Odontología preventiva", "Radiología dental"],
      },
      {
        id: "fisioterapia",
        label: "Fisioterapia y Rehabilitación",
        matchKeywords: ["fisioterap", "rehabilitación", "terapia física"],
        disciplinarySkills: ["Evaluación funcional", "Terapia manual", "Rehabilitación física", "Planes de ejercicio terapéutico"],
      },
      {
        id: "nutricion",
        label: "Nutrición",
        matchKeywords: ["nutrición", "nutricionista", "dietist"],
        disciplinarySkills: ["Valoración nutricional", "Planes de alimentación", "Nutrición clínica", "Educación nutricional"],
      },
    ],
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
    specialties: [
      {
        id: "tributaria",
        label: "Contabilidad Tributaria",
        matchKeywords: ["tributari", "impuestos", "declaración de renta"],
        disciplinarySkills: ["Normatividad tributaria", "Declaración de impuestos", "Planeación fiscal", "IVA y retención en la fuente"],
      },
      {
        id: "auditoria",
        label: "Auditoría",
        matchKeywords: ["auditor", "auditoría"],
        disciplinarySkills: ["Auditoría interna", "Control interno", "Normas de aseguramiento", "Evaluación de riesgos financieros"],
      },
      {
        id: "costos-presupuestos",
        label: "Costos y Presupuestos",
        matchKeywords: ["costos", "presupuesto"],
        disciplinarySkills: ["Contabilidad de costos", "Elaboración de presupuestos", "Análisis de variaciones", "Costeo ABC"],
      },
      {
        id: "finanzas-corporativas",
        label: "Finanzas Corporativas y Tesorería",
        matchKeywords: ["finanzas corporativas", "tesorería", "flujo de caja"],
        disciplinarySkills: ["Gestión de tesorería", "Análisis financiero", "Flujo de caja", "Evaluación de proyectos de inversión"],
      },
    ],
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
    specialties: [
      {
        id: "desarrollo-software",
        label: "Desarrollo de Software",
        matchKeywords: ["desarrollador", "programación", "software", "frontend", "backend", "fullstack"],
        disciplinarySkills: ["Lenguajes de programación", "Desarrollo web y móvil", "Pruebas de software", "Arquitectura de software"],
      },
      {
        id: "datos-ia",
        label: "Datos e Inteligencia Artificial",
        matchKeywords: ["datos", "machine learning", "inteligencia artificial", "data science", "analista de datos"],
        disciplinarySkills: ["Análisis de datos", "Machine learning", "Modelos estadísticos", "Visualización de datos"],
      },
      {
        id: "infraestructura-redes",
        label: "Infraestructura y Redes",
        matchKeywords: ["redes", "infraestructura", "devops", "servidores", "ciberseguridad"],
        disciplinarySkills: ["Administración de redes", "Ciberseguridad", "Infraestructura en la nube", "DevOps"],
      },
      {
        id: "ingenieria-civil",
        label: "Ingeniería Civil",
        matchKeywords: ["ingeniería civil", "construcción", "obras civiles"],
        disciplinarySkills: ["Diseño estructural", "Gestión de obras civiles", "Interventoría de proyectos", "Normas de construcción"],
      },
      {
        id: "ingenieria-industrial",
        label: "Ingeniería Industrial",
        matchKeywords: ["ingeniería industrial", "procesos productivos"],
        disciplinarySkills: ["Optimización de procesos", "Estudio de tiempos y movimientos", "Gestión de la calidad", "Investigación de operaciones"],
      },
    ],
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
    specialties: [
      {
        id: "ventas-b2b",
        label: "Ventas Consultivas B2B",
        matchKeywords: ["ventas b2b", "ventas corporativas", "cuentas clave", "key account"],
        disciplinarySkills: ["Venta consultiva", "Gestión de cuentas clave", "Negociación B2B", "Ciclo de ventas complejo"],
      },
      {
        id: "ventas-retail",
        label: "Ventas Retail",
        matchKeywords: ["retail", "punto de venta", "mostrador"],
        disciplinarySkills: ["Atención en punto de venta", "Visual merchandising", "Manejo de caja", "Indicadores de venta retail"],
      },
      {
        id: "seguros-financieros",
        label: "Seguros y Servicios Financieros",
        matchKeywords: ["seguros", "pólizas", "asesor financiero"],
        disciplinarySkills: ["Venta de seguros", "Asesoría financiera", "Normatividad de seguros", "Gestión de pólizas"],
      },
      {
        id: "comercio-exterior",
        label: "Comercio Exterior",
        matchKeywords: ["comercio exterior", "importaciones", "exportaciones", "aduanas"],
        disciplinarySkills: ["Procesos de importación y exportación", "Normatividad aduanera", "Logística internacional", "Incoterms"],
      },
    ],
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
    specialties: [
      {
        id: "nomina-compensacion",
        label: "Nómina y Compensación",
        matchKeywords: ["nómina", "compensación", "salarios"],
        disciplinarySkills: ["Liquidación de nómina", "Estructuras salariales", "Seguridad social", "Compensación y beneficios"],
      },
      {
        id: "reclutamiento-seleccion",
        label: "Reclutamiento y Selección",
        matchKeywords: ["reclutamiento", "selección de personal", "headhunting"],
        disciplinarySkills: ["Entrevistas por competencias", "Pruebas psicotécnicas", "Búsqueda de talento", "Onboarding"],
      },
      {
        id: "desarrollo-organizacional",
        label: "Desarrollo Organizacional",
        matchKeywords: ["desarrollo organizacional", "capacitación", "formación de personal"],
        disciplinarySkills: ["Diseño de programas de capacitación", "Gestión del cambio organizacional", "Evaluación de desempeño", "Planes de carrera"],
      },
      {
        id: "relaciones-laborales",
        label: "Relaciones Laborales",
        matchKeywords: ["relaciones laborales", "sindicato", "negociación colectiva"],
        disciplinarySkills: ["Normatividad laboral", "Negociación colectiva", "Manejo de conflictos laborales", "Comités de convivencia"],
      },
    ],
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
    specialties: [
      {
        id: "marketing-digital-performance",
        label: "Marketing Digital y Performance",
        matchKeywords: ["marketing digital", "performance", "pauta digital", "google ads", "meta ads"],
        disciplinarySkills: ["Publicidad digital (Google/Meta Ads)", "SEO/SEM", "Analítica web", "Marketing de performance"],
      },
      {
        id: "comunicacion-corporativa",
        label: "Comunicación Corporativa y RRPP",
        matchKeywords: ["comunicación corporativa", "relaciones públicas", "prensa"],
        disciplinarySkills: ["Relaciones públicas", "Comunicación institucional", "Manejo de crisis", "Redacción corporativa"],
      },
      {
        id: "diseno-branding",
        label: "Diseño y Branding",
        matchKeywords: ["diseño gráfico", "branding", "identidad de marca"],
        disciplinarySkills: ["Diseño de marca", "Identidad visual", "Herramientas de diseño (Adobe)", "Branding estratégico"],
      },
      {
        id: "investigacion-mercados",
        label: "Investigación de Mercados",
        matchKeywords: ["investigación de mercados", "estudios de mercado"],
        disciplinarySkills: ["Diseño de encuestas", "Análisis de consumidor", "Estudios de mercado", "Segmentación de mercado"],
      },
    ],
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
    specialties: [
      {
        id: "cadena-suministro",
        label: "Cadena de Suministro",
        matchKeywords: ["cadena de suministro", "supply chain"],
        disciplinarySkills: ["Gestión de la cadena de suministro", "Planeación de la demanda", "Compras y abastecimiento", "Indicadores de supply chain"],
      },
      {
        id: "transporte-distribucion",
        label: "Transporte y Distribución",
        matchKeywords: ["transporte", "distribución", "flota"],
        disciplinarySkills: ["Gestión de flotas", "Ruteo y distribución", "Costos de transporte", "Normatividad de transporte de carga"],
      },
      {
        id: "produccion-manufactura",
        label: "Producción y Manufactura",
        matchKeywords: ["producción", "manufactura", "planta"],
        disciplinarySkills: ["Planeación de producción", "Manufactura esbelta (Lean)", "Mantenimiento industrial", "Seguridad industrial"],
      },
      {
        id: "control-calidad",
        label: "Control de Calidad",
        matchKeywords: ["control de calidad", "aseguramiento de calidad", "iso"],
        disciplinarySkills: ["Normas ISO", "Control estadístico de calidad", "Auditorías de calidad", "Gestión de no conformidades"],
      },
    ],
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
    specialties: [
      {
        id: "derecho-laboral",
        label: "Derecho Laboral",
        matchKeywords: ["derecho laboral", "laboralista"],
        disciplinarySkills: ["Contratación laboral", "Liquidación de prestaciones sociales", "Litigios laborales", "Normatividad laboral"],
      },
      {
        id: "derecho-penal",
        label: "Derecho Penal",
        matchKeywords: ["derecho penal", "penalista", "litigio penal"],
        disciplinarySkills: ["Procedimiento penal", "Defensa penal", "Investigación criminal", "Audiencias penales"],
      },
      {
        id: "derecho-civil-comercial",
        label: "Derecho Civil y Comercial",
        matchKeywords: ["derecho civil", "derecho comercial", "contratos civiles"],
        disciplinarySkills: ["Redacción de contratos civiles y comerciales", "Derecho societario", "Procesos civiles", "Cobro jurídico"],
      },
      {
        id: "derecho-corporativo-tributario",
        label: "Derecho Corporativo y Tributario",
        matchKeywords: ["derecho corporativo", "derecho tributario", "compliance"],
        disciplinarySkills: ["Derecho corporativo", "Cumplimiento normativo (compliance)", "Derecho tributario", "Fusiones y adquisiciones"],
      },
    ],
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
  const haystack = normalizeForMatch(`${headline || ""} ${rawText}`);

  let best: { profile: ProfessionProfile; score: number } | null = null;
  for (const profile of PROFESSION_PROFILES) {
    const score = profile.matchKeywords.reduce(
      (sum, kw) => sum + (haystack.includes(normalizeForMatch(kw)) ? 1 : 0),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { profile, score };
    }
  }

  return best ? best.profile : GENERAL_PROFILE;
}

/**
 * Subject-matter/disciplinary specialty within a profession (e.g. "Física" within "Educación") —
 * same keyword-scoring pattern as detectProfession, scoped to just that profile's own specialties.
 * Returns null rather than forcing a guess when nothing scores, since not every profile/CV has a
 * clean specialty match (e.g. GENERAL_PROFILE has no specialties at all).
 */
export function detectSpecialty(profile: ProfessionProfile, rawText: string, headline?: string): Specialty | null {
  if (!profile.specialties || profile.specialties.length === 0) return null;
  const haystack = normalizeForMatch(`${headline || ""} ${rawText}`);

  let best: { specialty: Specialty; score: number } | null = null;
  for (const specialty of profile.specialties) {
    const score = specialty.matchKeywords.reduce(
      (sum, kw) => sum + (haystack.includes(normalizeForMatch(kw)) ? 1 : 0),
      0
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { specialty, score };
    }
  }

  return best ? best.specialty : null;
}
