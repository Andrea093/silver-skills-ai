// Profession taxonomy used to make the generated/analyzed CV differ meaningfully by profile
// instead of applying one generic template to everyone. Categories are intentionally broad
// (LATAM-relevant occupations), not an exhaustive classification system.

import { normalizeForMatch } from "../lib/textNormalize";

// Objective knowledge-check question — for Dimension 2 (disciplinary/specialty content knowledge).
// `skill` must match an entry in the specialty's `disciplinarySkills` exactly, so a correct/incorrect
// answer maps directly onto that same named Skill row used everywhere else in the app.
export interface KnowledgeQuestion {
  skill: string;
  question: string;
  options: string[];
  correctIndex: number;
}

// Behaviorally-anchored self-assessment question (BARS method, standard HR practice) — for
// Dimension 1 (general role skills). Options are 5 concrete anchors ordered low-to-high
// frequency/confidence, not a vague "rate yourself" free scale.
export interface BehaviorQuestion {
  skill: string;
  question: string;
  options: string[];
}

export interface Specialty {
  id: string;
  label: string;
  matchKeywords: string[];
  disciplinarySkills: string[];
  knowledgeQuestions: KnowledgeQuestion[];
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
  // Real, field-specific growth/interest areas offered in the "Áreas de Interés" wizard step —
  // distinct from atsKeywords (current-role skills): these are where the field itself is heading.
  interestAreas: string[];
  behaviorQuestions: BehaviorQuestion[];
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
    interestAreas: ["Tecnología Educativa (EdTech)", "Educación Inclusiva", "Bilingüismo e Idiomas", "Neuroeducación", "Gestión de Aula Virtual"],
    behaviorQuestions: [
      {
        skill: "Planeación curricular",
        question: "¿Con qué frecuencia ajustas tu planeación de clase según el avance real de tus estudiantes?",
        options: ["Nunca ajusto mi planeación, sigo siempre el mismo plan", "Rara vez, solo si surge un problema grave", "A veces, cuando noto dificultades evidentes", "Frecuentemente, reviso y ajusto mi planeación con regularidad", "Siempre, la planeación es un proceso continuo que reviso constantemente"],
      },
      {
        skill: "Evaluación por competencias",
        question: "¿Con qué frecuencia evalúas a tus estudiantes con criterios más allá de exámenes memorísticos (ej. proyectos, rúbricas de desempeño)?",
        options: ["Nunca, solo uso exámenes tradicionales", "Rara vez", "A veces, combinando algunos métodos", "Frecuentemente, uso variedad de instrumentos de evaluación", "Siempre, mi evaluación es integralmente por competencias"],
      },
      {
        skill: "Gestión de aula",
        question: "¿Con qué frecuencia aplicas estrategias específicas para manejar la disciplina y el ambiente de aprendizaje en el aula?",
        options: ["Nunca, no tengo una estrategia definida", "Rara vez, improviso según el momento", "A veces, tengo algunas reglas básicas", "Frecuentemente, aplico estrategias consistentes de gestión de aula", "Siempre, tengo un sistema estructurado y efectivo de gestión de aula"],
      },
      {
        skill: "Metodologías activas de aprendizaje",
        question: "¿Con qué frecuencia usas metodologías activas (ej. aprendizaje basado en proyectos, aula invertida) en lugar de clases magistrales?",
        options: ["Nunca, solo uso clase magistral tradicional", "Rara vez", "A veces, combino ambos enfoques", "Frecuentemente, priorizo metodologías activas", "Siempre, mi práctica docente es predominantemente activa y participativa"],
      },
      {
        skill: "TIC en educación",
        question: "¿Con qué frecuencia integras herramientas tecnológicas (plataformas digitales, apps educativas) en tus clases?",
        options: ["Nunca las uso", "Rara vez, solo ocasionalmente", "A veces, en algunas actividades puntuales", "Frecuentemente, son parte regular de mi metodología", "Siempre, integro tecnología de forma sistemática en mi enseñanza"],
      },
    ],
    specialties: [
      {
        id: "fisica",
        label: "Física",
        matchKeywords: ["física", "mecánica", "electromagnetismo", "termodinámica", "óptica"],
        disciplinarySkills: ["Mecánica clásica", "Electromagnetismo", "Termodinámica", "Física experimental y de laboratorio", "Resolución de problemas de física"],
        knowledgeQuestions: [
          {
            skill: "Mecánica clásica",
            question: "Según las leyes de Newton, ¿qué ocurre con un objeto en movimiento si la fuerza neta que actúa sobre él es cero?",
            options: ["Se detiene inmediatamente", "Continúa con velocidad constante en línea recta", "Acelera uniformemente", "Cambia de dirección aleatoriamente"],
            correctIndex: 1,
          },
          {
            skill: "Electromagnetismo",
            question: "¿Qué ley describe la relación entre la corriente eléctrica y el campo magnético que genera?",
            options: ["Ley de Ohm", "Ley de Ampère", "Ley de Hooke", "Ley de Boyle"],
            correctIndex: 1,
          },
          {
            skill: "Termodinámica",
            question: "¿Qué establece la segunda ley de la termodinámica?",
            options: ["La energía no se crea ni se destruye", "La entropía de un sistema aislado nunca disminuye", "La presión y el volumen son inversamente proporcionales", "El calor fluye de frío a caliente espontáneamente"],
            correctIndex: 1,
          },
          {
            skill: "Física experimental y de laboratorio",
            question: "Al reportar una medición experimental, ¿por qué es importante incluir la incertidumbre (margen de error)?",
            options: ["Es un requisito burocrático sin utilidad práctica", "Indica el rango de confianza real de la medición", "Aumenta artificialmente la precisión del resultado", "No es necesario si el instrumento es digital"],
            correctIndex: 1,
          },
          {
            skill: "Resolución de problemas de física",
            question: "Al resolver un problema de cinemática, ¿cuál es el primer paso recomendado?",
            options: ["Sustituir números en cualquier fórmula conocida", "Identificar las variables conocidas y desconocidas y elegir el marco de referencia", "Adivinar la respuesta y verificar unidades al final", "Ignorar las unidades hasta el resultado final"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "matematicas",
        label: "Matemáticas",
        matchKeywords: ["matemáticas", "álgebra", "cálculo", "geometría", "trigonometría", "estadística"],
        disciplinarySkills: ["Álgebra", "Cálculo diferencial e integral", "Geometría", "Estadística y probabilidad", "Pensamiento lógico-matemático"],
        knowledgeQuestions: [
          {
            skill: "Álgebra",
            question: "¿Cuál es la solución de la ecuación 2x + 6 = 0?",
            options: ["x = 3", "x = -3", "x = 6", "x = -6"],
            correctIndex: 1,
          },
          {
            skill: "Cálculo diferencial e integral",
            question: "¿Qué representa geométricamente la derivada de una función en un punto?",
            options: ["El área bajo la curva", "La pendiente de la recta tangente en ese punto", "El valor máximo de la función", "La distancia al origen"],
            correctIndex: 1,
          },
          {
            skill: "Geometría",
            question: "¿Cuánto suman los ángulos internos de un triángulo en geometría euclidiana?",
            options: ["90°", "180°", "270°", "360°"],
            correctIndex: 1,
          },
          {
            skill: "Estadística y probabilidad",
            question: "Si se lanza una moneda justa dos veces, ¿cuál es la probabilidad de obtener dos caras?",
            options: ["1/2", "1/3", "1/4", "1/8"],
            correctIndex: 2,
          },
          {
            skill: "Pensamiento lógico-matemático",
            question: "En una secuencia 2, 4, 8, 16, ..., ¿qué patrón siguen los números?",
            options: ["Suman 2 cada vez", "Se multiplican por 2 cada vez", "Alternan pares e impares", "Restan la mitad cada vez"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "quimica",
        label: "Química",
        matchKeywords: ["química", "químic"],
        disciplinarySkills: ["Química general", "Química orgánica", "Laboratorio de química", "Estequiometría"],
        knowledgeQuestions: [
          {
            skill: "Química general",
            question: "¿Qué partícula subatómica determina el número atómico de un elemento?",
            options: ["Neutrón", "Protón", "Electrón", "Isótopo"],
            correctIndex: 1,
          },
          {
            skill: "Química orgánica",
            question: "¿Cuál es el elemento central presente en todos los compuestos orgánicos?",
            options: ["Oxígeno", "Nitrógeno", "Carbono", "Hidrógeno"],
            correctIndex: 2,
          },
          {
            skill: "Laboratorio de química",
            question: "¿Por qué es importante usar equipo de protección personal (EPP) al manipular reactivos químicos?",
            options: ["Es solo una formalidad estética", "Previene la exposición a sustancias peligrosas y accidentes", "Mejora la precisión de las mediciones", "No es necesario con reactivos diluidos"],
            correctIndex: 1,
          },
          {
            skill: "Estequiometría",
            question: "En una reacción química balanceada, ¿qué principio permite calcular las cantidades de reactivos y productos?",
            options: ["La ley de conservación de la masa", "La ley de los gases ideales", "El principio de Le Chatelier", "La ley de Coulomb"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "ciencias-naturales",
        label: "Biología y Ciencias Naturales",
        matchKeywords: ["biología", "ciencias naturales", "biológ"],
        disciplinarySkills: ["Biología celular", "Ecología", "Ciencias naturales", "Laboratorio de ciencias"],
        knowledgeQuestions: [
          {
            skill: "Biología celular",
            question: "¿Cuál es la estructura celular encargada de producir la mayor parte de la energía (ATP) en una célula?",
            options: ["El núcleo", "La mitocondria", "El aparato de Golgi", "El retículo endoplasmático"],
            correctIndex: 1,
          },
          {
            skill: "Ecología",
            question: "¿Qué se entiende por 'cadena trófica' en un ecosistema?",
            options: ["La secuencia de transferencia de energía entre organismos a través de la alimentación", "La clasificación taxonómica de las especies", "El ciclo del agua en la naturaleza", "La migración estacional de animales"],
            correctIndex: 0,
          },
          {
            skill: "Ciencias naturales",
            question: "¿Cuál de los siguientes es un método propio del proceso científico?",
            options: ["Aceptar una idea sin ponerla a prueba", "Formular una hipótesis y diseñar un experimento para comprobarla", "Basarse únicamente en la opinión de una autoridad", "Repetir una creencia popular sin verificarla"],
            correctIndex: 1,
          },
          {
            skill: "Laboratorio de ciencias",
            question: "Al diseñar una práctica experimental para estudiantes, ¿qué elemento es esencial incluir?",
            options: ["Una variable controlada y una variable de estudio bien definidas", "Solo una lista de materiales sin procedimiento", "Resultados predeterminados que los estudiantes deben confirmar", "Ausencia total de supervisión durante la práctica"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "lengua-castellana",
        label: "Lengua Castellana y Literatura",
        matchKeywords: ["lengua castellana", "literatura", "español", "lectura crítica", "comprensión lectora"],
        disciplinarySkills: ["Comprensión lectora", "Producción textual", "Análisis literario", "Ortografía y redacción"],
        knowledgeQuestions: [
          {
            skill: "Comprensión lectora",
            question: "¿Qué habilidad describe mejor la 'inferencia' en comprensión lectora?",
            options: ["Repetir literalmente el texto", "Deducir información que no está explícita en el texto", "Memorizar el vocabulario nuevo", "Contar el número de párrafos"],
            correctIndex: 1,
          },
          {
            skill: "Producción textual",
            question: "¿Cuál es la estructura básica recomendada para un texto argumentativo?",
            options: ["Introducción, desarrollo con argumentos y conclusión", "Solo una lista de datos sin orden", "Únicamente diálogos", "Una sola oración por párrafo sin conexión"],
            correctIndex: 0,
          },
          {
            skill: "Análisis literario",
            question: "¿Qué elemento narrativo se refiere a 'quién cuenta la historia' en una obra literaria?",
            options: ["El tema", "El narrador", "La rima", "La métrica"],
            correctIndex: 1,
          },
          {
            skill: "Ortografía y redacción",
            question: "¿Cuál es la regla general para el uso de la tilde diacrítica (ej. 'él' vs 'el')?",
            options: ["Se usa para diferenciar palabras que se escriben igual pero cumplen funciones gramaticales distintas", "Se usa solo en palabras esdrújulas", "Nunca se usa en pronombres", "Es opcional según el gusto del escritor"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "ciencias-sociales",
        label: "Ciencias Sociales e Historia",
        matchKeywords: ["ciencias sociales", "historia", "geografía", "cátedra de paz"],
        disciplinarySkills: ["Historia", "Geografía", "Análisis de procesos sociales", "Cátedra de paz"],
        knowledgeQuestions: [
          {
            skill: "Historia",
            question: "¿Qué método es fundamental para el análisis histórico riguroso?",
            options: ["Aceptar una sola fuente sin cuestionarla", "Contrastar múltiples fuentes primarias y secundarias", "Basarse solo en la tradición oral sin verificación", "Ignorar el contexto de la época estudiada"],
            correctIndex: 1,
          },
          {
            skill: "Geografía",
            question: "¿Qué diferencia principal existe entre clima y tiempo atmosférico?",
            options: ["Son sinónimos exactos", "El clima es el patrón promedio a largo plazo; el tiempo es la condición atmosférica puntual", "El tiempo se mide en años y el clima en días", "No existe relación entre ambos conceptos"],
            correctIndex: 1,
          },
          {
            skill: "Análisis de procesos sociales",
            question: "¿Qué enfoque permite comprender mejor un fenómeno social complejo?",
            options: ["Analizarlo desde una sola disciplina de forma aislada", "Un enfoque interdisciplinario que considere factores económicos, políticos y culturales", "Ignorar el contexto histórico", "Basarse únicamente en opiniones personales"],
            correctIndex: 1,
          },
          {
            skill: "Cátedra de paz",
            question: "¿Cuál es uno de los objetivos centrales de la Cátedra de la Paz en el contexto educativo colombiano?",
            options: ["Promover la memoria histórica, la resolución pacífica de conflictos y la convivencia", "Enseñar exclusivamente historia militar", "Eliminar la enseñanza de la historia reciente", "Enfocarse solo en competencias matemáticas"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "idiomas",
        label: "Inglés y Otros Idiomas",
        matchKeywords: ["inglés", "idiomas", "bilingüe", "segunda lengua", "toefl", "esl"],
        disciplinarySkills: ["Gramática del idioma", "Comprensión auditiva y oral", "Metodología de enseñanza de idiomas (CLIL/TEFL)", "Certificación de dominio del idioma"],
        knowledgeQuestions: [
          {
            skill: "Gramática del idioma",
            question: "En inglés, ¿cuál es la estructura correcta del presente perfecto?",
            options: ["Subject + verb + ed", "Subject + have/has + past participle", "Subject + will + verb", "Subject + was/were + verb-ing"],
            correctIndex: 1,
          },
          {
            skill: "Comprensión auditiva y oral",
            question: "¿Qué estrategia es más efectiva para desarrollar la comprensión auditiva en un segundo idioma?",
            options: ["Exponerse únicamente a texto escrito", "Practicar con audio auténtico y variado, prediciendo contenido antes de escuchar", "Evitar el input oral hasta dominar la gramática", "Memorizar diálogos sin contexto"],
            correctIndex: 1,
          },
          {
            skill: "Metodología de enseñanza de idiomas (CLIL/TEFL)",
            question: "¿Qué caracteriza al enfoque CLIL (Content and Language Integrated Learning)?",
            options: ["Enseñar el idioma de forma aislada sin contenido temático", "Integrar el aprendizaje de contenidos de otra área junto con el idioma extranjero", "Prohibir el uso del idioma materno en cualquier contexto", "Enfocarse solo en gramática memorística"],
            correctIndex: 1,
          },
          {
            skill: "Certificación de dominio del idioma",
            question: "¿Qué marco internacional se usa comúnmente para describir niveles de dominio de un idioma (A1-C2)?",
            options: ["El Marco Común Europeo de Referencia (MCER/CEFR)", "El sistema métrico internacional", "La taxonomía de Bloom", "El índice de desarrollo humano"],
            correctIndex: 0,
          },
        ],
      },
      {
        id: "educacion-fisica",
        label: "Educación Física",
        matchKeywords: ["educación física", "deporte", "recreación", "entrenador"],
        disciplinarySkills: ["Desarrollo psicomotor", "Educación física y deporte", "Planeación de actividad física", "Primeros auxilios deportivos"],
        knowledgeQuestions: [
          {
            skill: "Desarrollo psicomotor",
            question: "¿Qué se entiende por 'desarrollo psicomotor' en la infancia?",
            options: ["Solo el crecimiento óseo", "La relación entre el desarrollo motor, cognitivo y afectivo del niño", "Únicamente la fuerza muscular", "Un concepto exclusivo de la educación especial"],
            correctIndex: 1,
          },
          {
            skill: "Educación física y deporte",
            question: "¿Cuál es un objetivo pedagógico central de la educación física escolar, más allá del rendimiento deportivo?",
            options: ["Formar atletas de élite exclusivamente", "Promover hábitos de vida saludable, trabajo en equipo y desarrollo integral", "Seleccionar a los estudiantes más talentosos y descartar al resto", "Enfocarse solo en la competencia y el resultado"],
            correctIndex: 1,
          },
          {
            skill: "Planeación de actividad física",
            question: "Al planear una sesión de actividad física para estudiantes, ¿qué es esencial considerar?",
            options: ["Aplicar la misma rutina a todos sin importar edad o condición", "Adaptar la intensidad y el tipo de actividad según edad, condición física y objetivos", "Omitir el calentamiento para ahorrar tiempo", "Ignorar las condiciones de salud de los estudiantes"],
            correctIndex: 1,
          },
          {
            skill: "Primeros auxilios deportivos",
            question: "Ante una lesión aguda como un esguince durante la clase, ¿cuál es el protocolo inicial recomendado (RICE)?",
            options: ["Calor, movimiento, presión y elevación", "Reposo, hielo, compresión y elevación", "Masaje inmediato y estiramiento forzado", "Ignorar la lesión y continuar la actividad"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "artes",
        label: "Artes",
        matchKeywords: ["artes", "música", "dibujo", "artístic"],
        disciplinarySkills: ["Educación artística", "Expresión plástica", "Apreciación estética", "Técnicas artísticas"],
        knowledgeQuestions: [
          {
            skill: "Educación artística",
            question: "¿Cuál es uno de los principales aportes de la educación artística al desarrollo integral del estudiante?",
            options: ["Solo entretenimiento sin valor formativo", "Desarrollo de la creatividad, la expresión personal y el pensamiento divergente", "Reemplazar completamente otras áreas del currículo", "Formar exclusivamente artistas profesionales"],
            correctIndex: 1,
          },
          {
            skill: "Expresión plástica",
            question: "En artes plásticas, ¿qué se entiende por 'composición'?",
            options: ["El precio de los materiales usados", "La organización y disposición de los elementos visuales en una obra", "El nombre del artista", "El tamaño exacto del lienzo"],
            correctIndex: 1,
          },
          {
            skill: "Apreciación estética",
            question: "¿Qué implica desarrollar la 'apreciación estética' en los estudiantes?",
            options: ["Memorizar nombres de artistas sin analizar sus obras", "Cultivar la capacidad de observar, interpretar y valorar críticamente expresiones artísticas", "Imponer un único criterio de belleza como correcto", "Evitar cualquier análisis crítico del arte"],
            correctIndex: 1,
          },
          {
            skill: "Técnicas artísticas",
            question: "¿Cuál es una diferencia clave entre la técnica de acuarela y la técnica de óleo?",
            options: ["No existe ninguna diferencia", "La acuarela se diluye en agua y seca rápido; el óleo se diluye en aceite y seca lento", "El óleo siempre es más económico", "La acuarela solo se usa en escultura"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "informatica-escolar",
        label: "Informática y Tecnología",
        matchKeywords: ["informática", "tecnología e informática", "ofimática"],
        disciplinarySkills: ["Programación básica para educación", "Ofimática", "Robótica educativa", "Pensamiento computacional"],
        knowledgeQuestions: [
          {
            skill: "Programación básica para educación",
            question: "¿Qué estructura de control permite repetir un bloque de instrucciones varias veces en programación?",
            options: ["Una condicional (if)", "Un bucle (loop/for/while)", "Una variable", "Un comentario"],
            correctIndex: 1,
          },
          {
            skill: "Ofimática",
            question: "En una hoja de cálculo, ¿qué función se usa comúnmente para sumar un rango de celdas?",
            options: ["=CONCATENAR()", "=SUMA()", "=BUSCARV()", "=SI()"],
            correctIndex: 1,
          },
          {
            skill: "Robótica educativa",
            question: "¿Cuál es un beneficio pedagógico central de la robótica educativa en el aula?",
            options: ["Solo entretener a los estudiantes sin aprendizaje real", "Desarrollar pensamiento lógico, resolución de problemas y trabajo colaborativo", "Reemplazar completamente la enseñanza de otras materias", "Enseñar exclusivamente a programar robots industriales"],
            correctIndex: 1,
          },
          {
            skill: "Pensamiento computacional",
            question: "¿Qué habilidad NO forma parte del pensamiento computacional?",
            options: ["Descomposición de problemas", "Reconocimiento de patrones", "Memorización mecánica sin análisis", "Abstracción y diseño de algoritmos"],
            correctIndex: 2,
          },
        ],
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
    interestAreas: ["Telemedicina", "Salud Mental", "Bienestar Corporativo", "Gerontología y Cuidado del Adulto Mayor", "Medicina Preventiva"],
    behaviorQuestions: [
      {
        skill: "Atención al paciente",
        question: "¿Con qué frecuencia dedicas tiempo a explicar claramente el diagnóstico y tratamiento a tus pacientes?",
        options: ["Nunca explico, solo indico el tratamiento", "Rara vez, doy poca información", "A veces, según el tiempo disponible", "Frecuentemente, procuro explicar con claridad", "Siempre, es una prioridad en mi práctica"],
      },
      {
        skill: "Historia clínica",
        question: "¿Con qué frecuencia documentas de forma completa y oportuna la historia clínica de tus pacientes?",
        options: ["Nunca la documento completamente", "Rara vez, solo lo esencial", "A veces, según la carga de trabajo", "Frecuentemente, la documento con detalle", "Siempre, es una práctica sistemática y rigurosa para mí"],
      },
      {
        skill: "Protocolos de bioseguridad",
        question: "¿Con qué frecuencia aplicas de forma estricta los protocolos de bioseguridad en tu práctica diaria?",
        options: ["Nunca los sigo estrictamente", "Rara vez", "A veces, dependiendo del procedimiento", "Frecuentemente, los aplico de forma consistente", "Siempre, sin excepción en cada procedimiento"],
      },
      {
        skill: "Trabajo interdisciplinario",
        question: "¿Con qué frecuencia colaboras activamente con otros profesionales de la salud en el cuidado de un paciente?",
        options: ["Nunca colaboro con otros profesionales", "Rara vez", "A veces, en casos complejos puntuales", "Frecuentemente, coordino con otros profesionales", "Siempre, el trabajo en equipo es central en mi práctica"],
      },
      {
        skill: "Manejo de urgencias",
        question: "¿Qué tan preparado/a te sientes para responder ante una situación de urgencia médica inesperada?",
        options: ["Nada preparado/a, no tengo entrenamiento reciente", "Poco preparado/a", "Medianamente preparado/a", "Bien preparado/a, con entrenamiento reciente", "Muy bien preparado/a, con experiencia y entrenamiento actualizado"],
      },
    ],
    specialties: [
      {
        id: "medicina-general",
        label: "Medicina General",
        matchKeywords: ["médico general", "medicina general", "medicina interna"],
        disciplinarySkills: ["Diagnóstico clínico", "Semiología", "Farmacología clínica", "Manejo de patologías comunes"],
        knowledgeQuestions: [
          {
            skill: "Diagnóstico clínico",
            question: "¿Cuál es el primer paso fundamental en el proceso de diagnóstico clínico?",
            options: ["Prescribir tratamiento de inmediato sin evaluación", "Realizar una historia clínica y examen físico completos", "Solicitar todos los exámenes de laboratorio disponibles sin criterio", "Basarse solo en la opinión del paciente sin evaluación"],
            correctIndex: 1,
          },
          {
            skill: "Semiología",
            question: "En semiología médica, ¿qué es un 'signo' a diferencia de un 'síntoma'?",
            options: ["Son sinónimos exactos", "El signo es objetivo y observable por el examinador; el síntoma es subjetivo y referido por el paciente", "El signo solo aplica en cirugía", "El síntoma siempre es más confiable que el signo"],
            correctIndex: 1,
          },
          {
            skill: "Farmacología clínica",
            question: "¿Qué se entiende por 'interacción farmacológica'?",
            options: ["El efecto de un medicamento tomado solo", "El efecto que se produce cuando dos o más medicamentos se administran juntos y modifican su acción", "El costo de un medicamento", "El color de la presentación del medicamento"],
            correctIndex: 1,
          },
          {
            skill: "Manejo de patologías comunes",
            question: "En el manejo de la hipertensión arterial, ¿qué enfoque es generalmente recomendado como primera línea?",
            options: ["Solo tratamiento farmacológico sin cambios de hábitos", "Combinación de cambios en el estilo de vida y, si es necesario, tratamiento farmacológico", "Ignorar la condición si el paciente se siente bien", "Cirugía inmediata en todos los casos"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "enfermeria",
        label: "Enfermería",
        matchKeywords: ["enfermer"],
        disciplinarySkills: ["Cuidado de enfermería", "Administración de medicamentos", "Control de signos vitales", "Procedimientos de enfermería"],
        knowledgeQuestions: [
          {
            skill: "Cuidado de enfermería",
            question: "¿Cuál es un principio fundamental del proceso de atención de enfermería (PAE)?",
            options: ["Actuar sin valorar previamente al paciente", "Valoración, diagnóstico, planeación, ejecución y evaluación del cuidado", "Aplicar el mismo plan de cuidado a todos los pacientes sin individualizar", "Omitir el registro de las intervenciones realizadas"],
            correctIndex: 1,
          },
          {
            skill: "Administración de medicamentos",
            question: "¿Cuáles son los '5 correctos' clásicos en la administración segura de medicamentos?",
            options: ["Paciente, medicamento, dosis, vía y hora correctos", "Solo verificar el nombre del medicamento", "Color, sabor, olor, textura y precio", "Marca, fecha de fabricación, país de origen, precio y proveedor"],
            correctIndex: 0,
          },
          {
            skill: "Control de signos vitales",
            question: "¿Cuáles son los signos vitales básicos que se monitorean de forma rutinaria?",
            options: ["Peso, altura, edad y género", "Frecuencia cardíaca, frecuencia respiratoria, temperatura y presión arterial", "Color de piel, tono de voz y estado de ánimo", "Nivel educativo y ocupación"],
            correctIndex: 1,
          },
          {
            skill: "Procedimientos de enfermería",
            question: "Antes de realizar cualquier procedimiento invasivo, ¿qué principio de bioseguridad es esencial?",
            options: ["Omitir el lavado de manos si se tiene prisa", "Aplicar la técnica aséptica y usar el equipo de protección adecuado", "Reutilizar material desechable para ahorrar recursos", "No es necesario informar al paciente sobre el procedimiento"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "psicologia-clinica",
        label: "Psicología Clínica",
        matchKeywords: ["psicolog", "psicoterapia", "salud mental"],
        disciplinarySkills: ["Evaluación psicológica", "Psicoterapia", "Intervención en crisis", "Psicodiagnóstico"],
        knowledgeQuestions: [
          {
            skill: "Evaluación psicológica",
            question: "¿Qué caracteriza a una evaluación psicológica rigurosa?",
            options: ["Basarse únicamente en la primera impresión", "El uso de múltiples fuentes de información: entrevista, observación y pruebas estandarizadas", "Evitar el uso de instrumentos validados", "Realizarse en una sola sesión sin seguimiento"],
            correctIndex: 1,
          },
          {
            skill: "Psicoterapia",
            question: "¿Cuál es un elemento común a la mayoría de los enfoques psicoterapéuticos efectivos?",
            options: ["La ausencia total de una relación terapéutica", "El establecimiento de una alianza terapéutica sólida entre paciente y terapeuta", "Evitar cualquier estructura en las sesiones", "Centrarse exclusivamente en el pasado del paciente"],
            correctIndex: 1,
          },
          {
            skill: "Intervención en crisis",
            question: "¿Cuál es el objetivo principal de la intervención en crisis?",
            options: ["Resolver todos los problemas de fondo del paciente de inmediato", "Estabilizar emocionalmente a la persona y garantizar su seguridad en el corto plazo", "Postergar cualquier acción hasta la siguiente cita programada", "Ignorar el riesgo inmediato y enfocarse en el diagnóstico"],
            correctIndex: 1,
          },
          {
            skill: "Psicodiagnóstico",
            question: "¿Qué instrumento es comúnmente utilizado en psicodiagnóstico para evaluar rasgos de personalidad?",
            options: ["Un electrocardiograma", "Un inventario de personalidad estandarizado (ej. MMPI)", "Una radiografía", "Un examen de sangre"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "odontologia",
        label: "Odontología",
        matchKeywords: ["odontolog", "dental"],
        disciplinarySkills: ["Procedimientos odontológicos", "Endodoncia", "Odontología preventiva", "Radiología dental"],
        knowledgeQuestions: [
          {
            skill: "Procedimientos odontológicos",
            question: "¿Cuál es un paso esencial de bioseguridad antes de iniciar cualquier procedimiento odontológico?",
            options: ["Omitir el uso de guantes si el paciente parece sano", "Esterilización del instrumental y uso de barreras de protección", "Reutilizar agujas entre pacientes", "No es necesario el historial médico del paciente"],
            correctIndex: 1,
          },
          {
            skill: "Endodoncia",
            question: "¿En qué consiste básicamente un tratamiento de endodoncia (conducto radicular)?",
            options: ["La extracción completa del diente", "La eliminación del tejido pulpar dañado o infectado dentro del diente y su posterior sellado", "Solo la limpieza superficial del esmalte", "La colocación de un implante dental"],
            correctIndex: 1,
          },
          {
            skill: "Odontología preventiva",
            question: "¿Cuál es una medida clave de odontología preventiva recomendada en la población general?",
            options: ["Visitar al odontólogo solo cuando hay dolor severo", "Controles periódicos, uso de flúor y técnica correcta de cepillado", "Evitar cualquier limpieza dental profesional", "Usar únicamente enjuague bucal sin cepillado"],
            correctIndex: 1,
          },
          {
            skill: "Radiología dental",
            question: "¿Para qué se utiliza principalmente una radiografía panorámica en odontología?",
            options: ["Solo para fines estéticos", "Para obtener una vista general de toda la estructura dental, maxilar y mandibular", "Para medir la presión arterial", "Para evaluar la audición del paciente"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "fisioterapia",
        label: "Fisioterapia y Rehabilitación",
        matchKeywords: ["fisioterap", "rehabilitación", "terapia física"],
        disciplinarySkills: ["Evaluación funcional", "Terapia manual", "Rehabilitación física", "Planes de ejercicio terapéutico"],
        knowledgeQuestions: [
          {
            skill: "Evaluación funcional",
            question: "¿Qué busca principalmente una evaluación funcional en fisioterapia?",
            options: ["Solo medir el dolor reportado por el paciente", "Determinar el nivel de movilidad, fuerza y capacidad funcional del paciente para actividades diarias", "Diagnosticar enfermedades infecciosas", "Recetar medicamentos"],
            correctIndex: 1,
          },
          {
            skill: "Terapia manual",
            question: "¿Qué caracteriza a las técnicas de terapia manual en fisioterapia?",
            options: ["El uso exclusivo de máquinas sin contacto físico", "Técnicas prácticas con las manos para evaluar y tratar tejidos blandos y articulaciones", "Solo se aplican mediante cirugía", "No requieren ningún conocimiento anatómico"],
            correctIndex: 1,
          },
          {
            skill: "Rehabilitación física",
            question: "En un proceso de rehabilitación tras una lesión, ¿por qué es importante la progresión gradual de los ejercicios?",
            options: ["No es importante, se puede iniciar con máxima intensidad de inmediato", "Permite una recuperación segura, evitando reagravar la lesión", "Solo sirve para alargar el tratamiento innecesariamente", "Es solo una preferencia del paciente sin base clínica"],
            correctIndex: 1,
          },
          {
            skill: "Planes de ejercicio terapéutico",
            question: "¿Qué elemento debe considerarse al diseñar un plan de ejercicio terapéutico individualizado?",
            options: ["Aplicar el mismo plan genérico a todos los pacientes", "Los objetivos, condición actual, limitaciones y progresión del paciente específico", "Ignorar el diagnóstico médico previo", "Basarse solo en la edad del paciente"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "nutricion",
        label: "Nutrición",
        matchKeywords: ["nutrición", "nutricionista", "dietist"],
        disciplinarySkills: ["Valoración nutricional", "Planes de alimentación", "Nutrición clínica", "Educación nutricional"],
        knowledgeQuestions: [
          {
            skill: "Valoración nutricional",
            question: "¿Qué componentes incluye típicamente una valoración nutricional completa?",
            options: ["Solo el peso corporal", "Antropometría, indicadores bioquímicos, historia clínica y dietética", "Únicamente las preferencias alimentarias del paciente", "Solo la edad y el género"],
            correctIndex: 1,
          },
          {
            skill: "Planes de alimentación",
            question: "Al diseñar un plan de alimentación, ¿qué principio es fundamental?",
            options: ["Aplicar el mismo plan a todas las personas sin distinción", "Individualizar según necesidades energéticas, condición de salud y preferencias culturales", "Ignorar las alergias o intolerancias del paciente", "Basarse solo en tendencias de moda sin evidencia"],
            correctIndex: 1,
          },
          {
            skill: "Nutrición clínica",
            question: "¿En qué contexto se aplica principalmente la nutrición clínica?",
            options: ["Solo en personas sanas sin ninguna condición médica", "En el manejo nutricional de pacientes con enfermedades o condiciones médicas específicas", "Únicamente en el ámbito deportivo de alto rendimiento", "Solo para fines estéticos"],
            correctIndex: 1,
          },
          {
            skill: "Educación nutricional",
            question: "¿Cuál es un objetivo central de la educación nutricional?",
            options: ["Imponer restricciones sin explicación", "Empoderar a las personas con conocimientos para tomar decisiones alimentarias informadas", "Memorizar tablas de calorías sin aplicación práctica", "Promover dietas extremas de corto plazo"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Finanzas Sostenibles (ESG)", "Fintech", "Automatización Contable", "Criptoactivos y Blockchain", "Planeación Financiera Personal"],
    behaviorQuestions: [
      {
        skill: "NIIF",
        question: "¿Con qué frecuencia aplicas o te mantienes actualizado/a sobre las normas NIIF en tu trabajo contable?",
        options: ["Nunca las aplico ni reviso", "Rara vez", "A veces, cuando es estrictamente necesario", "Frecuentemente, las aplico y reviso actualizaciones", "Siempre, es parte central de mi práctica y me mantengo actualizado/a"],
      },
      {
        skill: "Conciliación bancaria",
        question: "¿Con qué frecuencia realizas conciliaciones bancarias de forma sistemática?",
        options: ["Nunca las realizo", "Rara vez", "A veces, solo si hay discrepancias evidentes", "Frecuentemente, de forma periódica", "Siempre, las realizo de forma mensual y sistemática"],
      },
      {
        skill: "Estados financieros",
        question: "¿Con qué frecuencia elaboras o analizas estados financieros completos (balance, estado de resultados, flujo de efectivo)?",
        options: ["Nunca los elaboro ni analizo", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una tarea regular en mi rol"],
      },
      {
        skill: "Análisis de costos",
        question: "¿Con qué frecuencia analizas los costos para identificar oportunidades de eficiencia?",
        options: ["Nunca hago este tipo de análisis", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte sistemática de mi trabajo"],
      },
      {
        skill: "Excel avanzado",
        question: "¿Qué tan cómodo/a te sientes usando funciones avanzadas de Excel (tablas dinámicas, macros, fórmulas complejas)?",
        options: ["Nada cómodo/a, solo uso funciones básicas", "Poco cómodo/a", "Medianamente cómodo/a", "Cómodo/a, las uso con regularidad", "Muy cómodo/a, domino funciones avanzadas y las enseño a otros"],
      },
    ],
    specialties: [
      {
        id: "tributaria",
        label: "Contabilidad Tributaria",
        matchKeywords: ["tributari", "impuestos", "declaración de renta"],
        disciplinarySkills: ["Normatividad tributaria", "Declaración de impuestos", "Planeación fiscal", "IVA y retención en la fuente"],
        knowledgeQuestions: [
          {
            skill: "Normatividad tributaria",
            question: "¿Qué característica define a la normatividad tributaria?",
            options: ["Es opcional para las empresas", "Es un conjunto de leyes y regulaciones que rigen las obligaciones fiscales de personas y empresas", "Solo aplica a empresas multinacionales", "No cambia nunca a lo largo del tiempo"],
            correctIndex: 1,
          },
          {
            skill: "Declaración de impuestos",
            question: "¿Qué consecuencia principal puede tener la presentación extemporánea de una declaración de impuestos?",
            options: ["Ninguna, no genera ningún efecto", "Generalmente genera sanciones e intereses moratorios", "Un descuento automático en el impuesto a pagar", "La cancelación automática de la empresa"],
            correctIndex: 1,
          },
          {
            skill: "Planeación fiscal",
            question: "¿Cuál es el objetivo legítimo de la planeación fiscal?",
            options: ["Evadir impuestos ocultando ingresos", "Optimizar la carga tributaria dentro del marco legal vigente", "Falsificar documentos contables", "Ignorar las obligaciones fiscales"],
            correctIndex: 1,
          },
          {
            skill: "IVA y retención en la fuente",
            question: "¿Qué es la retención en la fuente?",
            options: ["Un impuesto adicional al IVA sin relación con otros tributos", "Un mecanismo de recaudo anticipado de un impuesto, descontado en el momento del pago", "Un beneficio tributario exclusivo para exportadores", "Una multa por incumplimiento fiscal"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "auditoria",
        label: "Auditoría",
        matchKeywords: ["auditor", "auditoría"],
        disciplinarySkills: ["Auditoría interna", "Control interno", "Normas de aseguramiento", "Evaluación de riesgos financieros"],
        knowledgeQuestions: [
          {
            skill: "Auditoría interna",
            question: "¿Cuál es el propósito principal de la auditoría interna en una organización?",
            options: ["Solo buscar errores para sancionar empleados", "Evaluar y mejorar la efectividad de los procesos de gestión de riesgos, control y gobierno", "Reemplazar completamente la contabilidad de la empresa", "Aprobar automáticamente todos los estados financieros"],
            correctIndex: 1,
          },
          {
            skill: "Control interno",
            question: "¿Qué componente NO forma parte del marco COSO de control interno?",
            options: ["Ambiente de control", "Evaluación de riesgos", "Maximización de utilidades a toda costa", "Actividades de monitoreo"],
            correctIndex: 2,
          },
          {
            skill: "Normas de aseguramiento",
            question: "¿Qué buscan garantizar las normas de aseguramiento de la información (NAI/NIA)?",
            options: ["Que los informes financieros sean creativos", "Que la información revisada sea confiable y cumpla estándares de calidad reconocidos", "Que las auditorías se hagan sin ningún estándar", "Que solo se audite una vez cada 10 años"],
            correctIndex: 1,
          },
          {
            skill: "Evaluación de riesgos financieros",
            question: "En la evaluación de riesgos financieros, ¿qué se entiende por 'riesgo de liquidez'?",
            options: ["El riesgo de que las acciones suban de precio", "El riesgo de no poder cumplir obligaciones de pago a corto plazo por falta de efectivo disponible", "El riesgo de contratar personal no calificado", "El riesgo de cambios en la moda del mercado"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "costos-presupuestos",
        label: "Costos y Presupuestos",
        matchKeywords: ["costos", "presupuesto"],
        disciplinarySkills: ["Contabilidad de costos", "Elaboración de presupuestos", "Análisis de variaciones", "Costeo ABC"],
        knowledgeQuestions: [
          {
            skill: "Contabilidad de costos",
            question: "¿Cuál es la diferencia principal entre costos fijos y costos variables?",
            options: ["No existe diferencia alguna", "Los costos fijos no cambian con el nivel de producción; los variables sí cambian proporcionalmente", "Los costos variables siempre son mayores que los fijos", "Los costos fijos solo aplican en empresas de servicios"],
            correctIndex: 1,
          },
          {
            skill: "Elaboración de presupuestos",
            question: "¿Qué es un presupuesto maestro en una organización?",
            options: ["Un documento sin relación con las finanzas de la empresa", "Un plan financiero integral que consolida todos los presupuestos individuales de la organización", "Solo el presupuesto del área de mercadeo", "Un documento que se elabora una sola vez en la historia de la empresa"],
            correctIndex: 1,
          },
          {
            skill: "Análisis de variaciones",
            question: "¿Qué representa una 'variación desfavorable' en el análisis presupuestal?",
            options: ["Cuando los resultados reales son mejores de lo esperado", "Cuando los resultados reales son peores de lo presupuestado (ej. más costos o menos ingresos de lo esperado)", "Cualquier cambio en el presupuesto sin importar la dirección", "Un error de cálculo en el presupuesto original"],
            correctIndex: 1,
          },
          {
            skill: "Costeo ABC",
            question: "¿En qué se basa el costeo ABC (Activity Based Costing)?",
            options: ["Asignar todos los costos por igual sin distinción", "Asignar los costos indirectos según las actividades que realmente los generan", "Ignorar los costos indirectos por completo", "Calcular costos solo al final del año fiscal"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "finanzas-corporativas",
        label: "Finanzas Corporativas y Tesorería",
        matchKeywords: ["finanzas corporativas", "tesorería", "flujo de caja"],
        disciplinarySkills: ["Gestión de tesorería", "Análisis financiero", "Flujo de caja", "Evaluación de proyectos de inversión"],
        knowledgeQuestions: [
          {
            skill: "Gestión de tesorería",
            question: "¿Cuál es un objetivo central de la gestión de tesorería en una empresa?",
            options: ["Maximizar el efectivo ocioso sin invertirlo nunca", "Asegurar la liquidez necesaria para las operaciones y optimizar el uso de los recursos financieros", "Ignorar los pagos a proveedores", "Solo gestionar las inversiones en bolsa"],
            correctIndex: 1,
          },
          {
            skill: "Análisis financiero",
            question: "¿Qué mide el indicador de liquidez conocido como 'razón corriente'?",
            options: ["La rentabilidad de las ventas", "La capacidad de la empresa de cubrir sus obligaciones de corto plazo con sus activos corrientes", "El nivel de endeudamiento a largo plazo", "El valor de mercado de las acciones"],
            correctIndex: 1,
          },
          {
            skill: "Flujo de caja",
            question: "¿Por qué una empresa puede ser rentable en el papel pero tener problemas de flujo de caja?",
            options: ["Es imposible que esto ocurra", "Porque las utilidades contables no siempre coinciden con el momento real de entrada y salida de efectivo", "Porque el flujo de caja no tiene relación con las ventas", "Porque las utilidades y el efectivo son siempre exactamente iguales"],
            correctIndex: 1,
          },
          {
            skill: "Evaluación de proyectos de inversión",
            question: "¿Qué indica un Valor Presente Neto (VPN) positivo en la evaluación de un proyecto de inversión?",
            options: ["Que el proyecto generará pérdidas seguras", "Que se espera que el proyecto genere valor por encima del costo de capital invertido", "Que el proyecto no requiere ninguna inversión inicial", "Que el proyecto durará menos de un año"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Inteligencia Artificial", "Ciberseguridad", "Computación en la Nube", "Sostenibilidad y Tecnología Verde", "Internet de las Cosas (IoT)"],
    behaviorQuestions: [
      {
        skill: "Desarrollo de software",
        question: "¿Con qué frecuencia participas activamente en el desarrollo o mantenimiento de software?",
        options: ["Nunca desarrollo software", "Rara vez", "A veces", "Frecuentemente", "Siempre, es mi actividad principal"],
      },
      {
        skill: "Metodologías ágiles (Scrum)",
        question: "¿Con qué frecuencia trabajas bajo metodologías ágiles (Scrum, Kanban) en tus proyectos?",
        options: ["Nunca las he usado", "Rara vez", "A veces", "Frecuentemente", "Siempre, es la metodología estándar en mi equipo"],
      },
      {
        skill: "Control de versiones (Git)",
        question: "¿Con qué frecuencia usas control de versiones (Git) en tu trabajo?",
        options: ["Nunca lo uso", "Rara vez", "A veces", "Frecuentemente", "Siempre, de forma sistemática en cada proyecto"],
      },
      {
        skill: "Bases de datos",
        question: "¿Qué tan cómodo/a te sientes diseñando o consultando bases de datos?",
        options: ["Nada cómodo/a", "Poco cómodo/a", "Medianamente cómodo/a", "Cómodo/a", "Muy cómodo/a, tengo experiencia sólida"],
      },
      {
        skill: "Análisis de requerimientos",
        question: "¿Con qué frecuencia participas en el levantamiento y análisis de requerimientos antes de iniciar un desarrollo?",
        options: ["Nunca participo en esta etapa", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una etapa clave que lidero o en la que participo activamente"],
      },
    ],
    specialties: [
      {
        id: "desarrollo-software",
        label: "Desarrollo de Software",
        matchKeywords: ["desarrollador", "programación", "software", "frontend", "backend", "fullstack"],
        disciplinarySkills: ["Lenguajes de programación", "Desarrollo web y móvil", "Pruebas de software", "Arquitectura de software"],
        knowledgeQuestions: [
          {
            skill: "Lenguajes de programación",
            question: "¿Qué es una variable en programación?",
            options: ["Un tipo de error del programa", "Un espacio de memoria con nombre que almacena un valor que puede cambiar", "Un comentario en el código", "Un archivo ejecutable"],
            correctIndex: 1,
          },
          {
            skill: "Desarrollo web y móvil",
            question: "¿Qué diferencia principal existe entre desarrollo 'frontend' y 'backend'?",
            options: ["Son exactamente lo mismo", "El frontend se encarga de la interfaz visible al usuario; el backend gestiona la lógica del servidor y datos", "El backend siempre se ejecuta en el navegador", "El frontend nunca usa JavaScript"],
            correctIndex: 1,
          },
          {
            skill: "Pruebas de software",
            question: "¿Qué es una 'prueba unitaria' en desarrollo de software?",
            options: ["Una prueba que evalúa todo el sistema completo integrado", "Una prueba automatizada que valida el comportamiento de una unidad pequeña de código de forma aislada", "Una encuesta a los usuarios finales", "Una revisión manual del diseño gráfico"],
            correctIndex: 1,
          },
          {
            skill: "Arquitectura de software",
            question: "¿Qué ventaja principal ofrece una arquitectura de microservicios frente a una monolítica?",
            options: ["Ninguna, son idénticas en funcionalidad", "Permite desplegar y escalar componentes de forma independiente", "Elimina por completo la necesidad de bases de datos", "Siempre es más simple de implementar que un monolito"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "datos-ia",
        label: "Datos e Inteligencia Artificial",
        matchKeywords: ["datos", "machine learning", "inteligencia artificial", "data science", "analista de datos"],
        disciplinarySkills: ["Análisis de datos", "Machine learning", "Modelos estadísticos", "Visualización de datos"],
        knowledgeQuestions: [
          {
            skill: "Análisis de datos",
            question: "¿Qué es la 'limpieza de datos' (data cleaning) en un proyecto de análisis?",
            options: ["Borrar todos los datos del proyecto", "El proceso de identificar y corregir errores, duplicados o valores faltantes en un conjunto de datos", "Cambiar el color de las gráficas", "Un paso opcional que rara vez es necesario"],
            correctIndex: 1,
          },
          {
            skill: "Machine learning",
            question: "¿Cuál es la diferencia principal entre aprendizaje supervisado y no supervisado?",
            options: ["No hay ninguna diferencia real", "El supervisado usa datos etiquetados con la respuesta correcta; el no supervisado busca patrones en datos sin etiquetar", "El no supervisado siempre es más preciso", "El supervisado no requiere ningún dato de entrenamiento"],
            correctIndex: 1,
          },
          {
            skill: "Modelos estadísticos",
            question: "En estadística, ¿qué mide la 'correlación' entre dos variables?",
            options: ["Que una variable causa directamente a la otra", "El grado y la dirección en que dos variables tienden a variar juntas", "El número total de datos en la muestra", "Solo se puede calcular con datos cualitativos"],
            correctIndex: 1,
          },
          {
            skill: "Visualización de datos",
            question: "¿Por qué es importante elegir el tipo correcto de gráfico al visualizar datos?",
            options: ["No importa, cualquier gráfico sirve para cualquier dato", "Porque cada tipo de gráfico comunica mejor cierto tipo de relación o patrón en los datos", "Los gráficos son solo decorativos, no comunican información", "Solo se debe usar gráficos de pastel siempre"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "infraestructura-redes",
        label: "Infraestructura y Redes",
        matchKeywords: ["redes", "infraestructura", "devops", "servidores", "ciberseguridad"],
        disciplinarySkills: ["Administración de redes", "Ciberseguridad", "Infraestructura en la nube", "DevOps"],
        knowledgeQuestions: [
          {
            skill: "Administración de redes",
            question: "¿Qué función cumple un router en una red?",
            options: ["Almacenar archivos de forma permanente", "Dirigir el tráfico de datos entre diferentes redes", "Solo mostrar páginas web", "Generar electricidad para los dispositivos"],
            correctIndex: 1,
          },
          {
            skill: "Ciberseguridad",
            question: "¿Qué es la 'autenticación de dos factores' (2FA)?",
            options: ["Usar la misma contraseña en dos sitios diferentes", "Un método de seguridad que requiere dos formas distintas de verificación de identidad", "Un tipo de virus informático", "Compartir la contraseña con un compañero de confianza"],
            correctIndex: 1,
          },
          {
            skill: "Infraestructura en la nube",
            question: "¿Qué ventaja ofrece la computación en la nube frente a servidores físicos propios tradicionales?",
            options: ["Ninguna ventaja real", "Escalabilidad flexible y menor necesidad de inversión en hardware propio", "Siempre es menos segura que un servidor físico local", "Elimina completamente la necesidad de cualquier mantenimiento"],
            correctIndex: 1,
          },
          {
            skill: "DevOps",
            question: "¿Qué busca principalmente la cultura y práctica de DevOps?",
            options: ["Separar completamente los equipos de desarrollo y operaciones", "Integrar y automatizar la colaboración entre desarrollo y operaciones para entregas más rápidas y confiables", "Eliminar las pruebas de software", "Evitar el uso de control de versiones"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "ingenieria-civil",
        label: "Ingeniería Civil",
        matchKeywords: ["ingeniería civil", "construcción", "obras civiles"],
        disciplinarySkills: ["Diseño estructural", "Gestión de obras civiles", "Interventoría de proyectos", "Normas de construcción"],
        knowledgeQuestions: [
          {
            skill: "Diseño estructural",
            question: "¿Qué debe garantizar principalmente el diseño estructural de una edificación?",
            options: ["Solo la estética visual del edificio", "Que la estructura resista las cargas y fuerzas a las que estará sometida con seguridad", "El menor costo posible sin importar la seguridad", "Que se construya en el menor tiempo posible sin otras consideraciones"],
            correctIndex: 1,
          },
          {
            skill: "Gestión de obras civiles",
            question: "¿Qué elemento es esencial en la planeación de una obra civil?",
            options: ["Iniciar la construcción sin ningún cronograma ni presupuesto definido", "Un cronograma de trabajo, presupuesto y plan de gestión de riesgos", "Ignorar los permisos y licencias de construcción", "No es necesario ningún estudio de suelos previo"],
            correctIndex: 1,
          },
          {
            skill: "Interventoría de proyectos",
            question: "¿Cuál es la función principal de la interventoría en un proyecto de construcción?",
            options: ["Ejecutar directamente la obra en lugar del contratista", "Supervisar y verificar que la obra se ejecute conforme a las especificaciones técnicas, normativas y contractuales", "Aprobar automáticamente cualquier cambio sin revisión", "No tiene ninguna función de control real"],
            correctIndex: 1,
          },
          {
            skill: "Normas de construcción",
            question: "En Colombia, ¿qué norma técnica rige los requisitos de sismo-resistencia en las construcciones?",
            options: ["La NIIF (Normas Internacionales de Información Financiera)", "La NSR-10 (Reglamento Colombiano de Construcción Sismo Resistente)", "El Código de Comercio", "La ISO 9001"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "ingenieria-industrial",
        label: "Ingeniería Industrial",
        matchKeywords: ["ingeniería industrial", "procesos productivos"],
        disciplinarySkills: ["Optimización de procesos", "Estudio de tiempos y movimientos", "Gestión de la calidad", "Investigación de operaciones"],
        knowledgeQuestions: [
          {
            skill: "Optimización de procesos",
            question: "¿Cuál es el objetivo principal de la optimización de procesos en una organización?",
            options: ["Aumentar la complejidad de los procesos existentes", "Mejorar la eficiencia, reducir desperdicios y maximizar el valor generado en un proceso", "Eliminar por completo la supervisión de calidad", "Ignorar los costos asociados al proceso"],
            correctIndex: 1,
          },
          {
            skill: "Estudio de tiempos y movimientos",
            question: "¿Qué busca principalmente un estudio de tiempos y movimientos?",
            options: ["Aumentar arbitrariamente la carga de trabajo de los empleados", "Analizar y estandarizar la forma más eficiente de realizar una tarea, reduciendo tiempos y esfuerzos innecesarios", "Medir únicamente cuánto gana cada empleado", "No tiene relación con la productividad"],
            correctIndex: 1,
          },
          {
            skill: "Gestión de la calidad",
            question: "¿Qué principio central promueve la filosofía de mejora continua conocida como Kaizen?",
            options: ["Realizar cambios drásticos una sola vez y nunca más revisarlos", "Buscar pequeñas mejoras constantes e incrementales en los procesos", "Ignorar los errores para no afectar la moral del equipo", "Centralizar todas las decisiones en una sola persona sin participación del equipo"],
            correctIndex: 1,
          },
          {
            skill: "Investigación de operaciones",
            question: "¿Para qué se utiliza principalmente la investigación de operaciones en una empresa?",
            options: ["Solo para investigar la competencia", "Para aplicar modelos matemáticos y análisis cuantitativo a la toma de decisiones complejas (ej. optimización de rutas, recursos)", "Para redactar contratos legales", "Para diseñar campañas publicitarias"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Ventas Consultivas Digitales", "E-commerce", "Experiencia del Cliente (CX)", "Automatización de Ventas (Sales Ops)", "Marketing de Relacionamiento"],
    behaviorQuestions: [
      {
        skill: "Prospección de clientes",
        question: "¿Con qué frecuencia realizas actividades activas de prospección de nuevos clientes?",
        options: ["Nunca prospecto activamente", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo un proceso sistemático de prospección"],
      },
      {
        skill: "Negociación y cierre",
        question: "¿Qué tan seguro/a te sientes liderando una negociación comercial hasta el cierre de una venta?",
        options: ["Nada seguro/a", "Poco seguro/a", "Medianamente seguro/a", "Seguro/a", "Muy seguro/a, tengo un historial consistente de cierres exitosos"],
      },
      {
        skill: "Gestión de cartera",
        question: "¿Con qué frecuencia haces seguimiento estructurado a tu cartera de clientes existentes?",
        options: ["Nunca hago seguimiento", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo un proceso sistemático de seguimiento"],
      },
      {
        skill: "CRM",
        question: "¿Con qué frecuencia usas un sistema CRM para gestionar tus clientes y oportunidades de venta?",
        options: ["Nunca he usado un CRM", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una herramienta central en mi trabajo diario"],
      },
      {
        skill: "Fidelización de clientes",
        question: "¿Con qué frecuencia implementas acciones específicas para fidelizar a tus clientes actuales?",
        options: ["Nunca implemento acciones de fidelización", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo una estrategia definida de fidelización"],
      },
    ],
    specialties: [
      {
        id: "ventas-b2b",
        label: "Ventas Consultivas B2B",
        matchKeywords: ["ventas b2b", "ventas corporativas", "cuentas clave", "key account"],
        disciplinarySkills: ["Venta consultiva", "Gestión de cuentas clave", "Negociación B2B", "Ciclo de ventas complejo"],
        knowledgeQuestions: [
          {
            skill: "Venta consultiva",
            question: "¿Qué caracteriza principalmente a la 'venta consultiva'?",
            options: ["Presionar al cliente para cerrar la venta lo más rápido posible sin entender sus necesidades", "Entender a profundidad las necesidades del cliente y ofrecer soluciones adaptadas a ellas", "Ofrecer siempre el producto más caro disponible", "Evitar cualquier conversación sobre las necesidades reales del cliente"],
            correctIndex: 1,
          },
          {
            skill: "Gestión de cuentas clave",
            question: "¿Por qué es importante la gestión estratégica de cuentas clave (Key Account Management)?",
            options: ["Porque todos los clientes generan el mismo valor para la empresa", "Porque los clientes más importantes requieren atención y estrategias personalizadas para maximizar la relación a largo plazo", "Porque reduce la necesidad de conocer al cliente", "Porque elimina la necesidad de hacer seguimiento post-venta"],
            correctIndex: 1,
          },
          {
            skill: "Negociación B2B",
            question: "En una negociación B2B efectiva, ¿qué enfoque suele generar mejores resultados a largo plazo?",
            options: ["Buscar que una parte gane todo y la otra pierda todo", "Buscar un resultado de beneficio mutuo (ganar-ganar) que sostenga la relación comercial", "Evitar cualquier concesión bajo cualquier circunstancia", "Ignorar los intereses de la otra parte"],
            correctIndex: 1,
          },
          {
            skill: "Ciclo de ventas complejo",
            question: "¿Qué caracteriza a un ciclo de ventas B2B 'complejo' frente a uno transaccional simple?",
            options: ["Se cierra siempre en una sola llamada", "Involucra múltiples tomadores de decisión, un proceso más largo y mayor valor de la transacción", "No requiere ningún seguimiento posterior", "Es idéntico a una venta minorista simple"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "ventas-retail",
        label: "Ventas Retail",
        matchKeywords: ["retail", "punto de venta", "mostrador"],
        disciplinarySkills: ["Atención en punto de venta", "Visual merchandising", "Manejo de caja", "Indicadores de venta retail"],
        knowledgeQuestions: [
          {
            skill: "Atención en punto de venta",
            question: "¿Qué elemento es clave para una buena experiencia de atención en el punto de venta?",
            options: ["Ignorar al cliente hasta que pregunte algo", "Una atención cordial, conocimiento del producto y disposición a resolver dudas", "Presionar al cliente constantemente para comprar más", "Evitar cualquier interacción personal"],
            correctIndex: 1,
          },
          {
            skill: "Visual merchandising",
            question: "¿Cuál es el propósito principal del visual merchandising en una tienda?",
            options: ["Solo decorar sin ningún objetivo comercial", "Presentar los productos de forma atractiva para influir positivamente en la decisión de compra", "Ocultar los productos menos populares completamente", "No tiene ninguna relación con las ventas"],
            correctIndex: 1,
          },
          {
            skill: "Manejo de caja",
            question: "¿Qué práctica es esencial al hacer el cierre de caja al final del turno?",
            options: ["No es necesario verificar nada", "Conciliar el efectivo físico con las ventas registradas en el sistema", "Guardar el dinero sin ningún registro", "Repartir el efectivo entre los empleados presentes"],
            correctIndex: 1,
          },
          {
            skill: "Indicadores de venta retail",
            question: "¿Qué mide el indicador de 'ticket promedio' en retail?",
            options: ["El número total de empleados en la tienda", "El valor promedio de compra por transacción o cliente", "El tiempo que tarda un cliente en la tienda", "El número de tiendas de la cadena"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "seguros-financieros",
        label: "Seguros y Servicios Financieros",
        matchKeywords: ["seguros", "pólizas", "asesor financiero"],
        disciplinarySkills: ["Venta de seguros", "Asesoría financiera", "Normatividad de seguros", "Gestión de pólizas"],
        knowledgeQuestions: [
          {
            skill: "Venta de seguros",
            question: "¿Qué principio ético es fundamental en la venta de seguros?",
            options: ["Ocultar las exclusiones y condiciones de la póliza para cerrar la venta", "Informar de forma clara y transparente las coberturas, exclusiones y condiciones del seguro", "Prometer coberturas que el producto no incluye", "Evitar explicar el contrato al cliente"],
            correctIndex: 1,
          },
          {
            skill: "Asesoría financiera",
            question: "¿Qué debe priorizar un asesor financiero al recomendar un producto a su cliente?",
            options: ["La comisión personal que recibirá el asesor", "El perfil de riesgo, objetivos y necesidades reales del cliente", "Vender siempre el producto más caro disponible", "Ignorar la situación financiera actual del cliente"],
            correctIndex: 1,
          },
          {
            skill: "Normatividad de seguros",
            question: "En general, ¿qué entidad suele regular y supervisar el sector asegurador en los países de LATAM?",
            options: ["No existe ninguna regulación del sector asegurador", "Una superintendencia financiera o de seguros del país correspondiente", "El Ministerio de Educación", "Una organización exclusivamente privada sin supervisión estatal"],
            correctIndex: 1,
          },
          {
            skill: "Gestión de pólizas",
            question: "¿Qué implica la 'renovación' de una póliza de seguros?",
            options: ["La cancelación definitiva del contrato", "La continuación de la cobertura del seguro por un nuevo periodo, generalmente tras revisar condiciones y prima", "Un tipo de siniestro cubierto", "Un descuento automático sin condiciones"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "comercio-exterior",
        label: "Comercio Exterior",
        matchKeywords: ["comercio exterior", "importaciones", "exportaciones", "aduanas"],
        disciplinarySkills: ["Procesos de importación y exportación", "Normatividad aduanera", "Logística internacional", "Incoterms"],
        knowledgeQuestions: [
          {
            skill: "Procesos de importación y exportación",
            question: "¿Qué documento es esencial en la mayoría de procesos de exportación para acreditar el origen de la mercancía?",
            options: ["El certificado de origen", "La licencia de conducción del transportista", "El certificado de matrimonio del exportador", "El horóscopo del comprador"],
            correctIndex: 0,
          },
          {
            skill: "Normatividad aduanera",
            question: "¿Qué función cumple principalmente la aduana en el comercio internacional?",
            options: ["Fijar los precios de venta de los productos", "Controlar y regular la entrada y salida de mercancías de un país, incluyendo el cobro de aranceles", "Diseñar el empaque de los productos", "Otorgar préstamos a los importadores"],
            correctIndex: 1,
          },
          {
            skill: "Logística internacional",
            question: "¿Qué factor es clave al elegir el modo de transporte (marítimo, aéreo, terrestre) en logística internacional?",
            options: ["Solo el color del empaque", "El equilibrio entre costo, tiempo de tránsito y naturaleza de la mercancía", "El idioma del país destino exclusivamente", "No hay ningún criterio relevante para esta decisión"],
            correctIndex: 1,
          },
          {
            skill: "Incoterms",
            question: "¿Qué regulan los Incoterms en una transacción de comercio internacional?",
            options: ["Las tasas de interés bancario", "La distribución de responsabilidades, costos y riesgos entre comprador y vendedor durante el transporte", "El diseño gráfico de las facturas", "Los impuestos sobre la renta de las empresas"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Bienestar Laboral", "People Analytics", "Diversidad e Inclusión", "Trabajo Remoto e Híbrido", "Cultura Organizacional"],
    behaviorQuestions: [
      {
        skill: "Reclutamiento y selección",
        question: "¿Con qué frecuencia lideras o participas en procesos completos de reclutamiento y selección de personal?",
        options: ["Nunca participo en estos procesos", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte central de mi rol"],
      },
      {
        skill: "Gestión de nómina",
        question: "¿Con qué frecuencia gestionas o supervisas procesos de nómina?",
        options: ["Nunca gestiono nómina", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una responsabilidad regular mía"],
      },
      {
        skill: "Clima organizacional",
        question: "¿Con qué frecuencia realizas o analizas mediciones de clima organizacional en tu empresa?",
        options: ["Nunca lo hago", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una práctica sistemática que lidero"],
      },
      {
        skill: "Capacitación y desarrollo",
        question: "¿Con qué frecuencia diseñas o coordinas programas de capacitación para colaboradores?",
        options: ["Nunca lo hago", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte central de mi trabajo"],
      },
      {
        skill: "Evaluación de desempeño",
        question: "¿Con qué frecuencia realizas evaluaciones formales de desempeño a colaboradores?",
        options: ["Nunca las realizo", "Rara vez", "A veces", "Frecuentemente", "Siempre, sigo un proceso sistemático y periódico"],
      },
    ],
    specialties: [
      {
        id: "nomina-compensacion",
        label: "Nómina y Compensación",
        matchKeywords: ["nómina", "compensación", "salarios"],
        disciplinarySkills: ["Liquidación de nómina", "Estructuras salariales", "Seguridad social", "Compensación y beneficios"],
        knowledgeQuestions: [
          {
            skill: "Liquidación de nómina",
            question: "¿Qué conceptos se incluyen típicamente en la liquidación de nómina de un empleado?",
            options: ["Solo el salario básico sin ningún otro concepto", "Salario, horas extras, deducciones legales, prestaciones sociales y aportes a seguridad social", "Únicamente bonificaciones discrecionales", "Solo se calcula una vez al año"],
            correctIndex: 1,
          },
          {
            skill: "Estructuras salariales",
            question: "¿Qué busca establecer una estructura salarial equitativa en una organización?",
            options: ["Pagar el mismo salario a todos los cargos sin distinción", "Definir rangos salariales coherentes según el nivel de responsabilidad, experiencia y mercado laboral", "Ignorar la equidad interna y externa", "Fijar los salarios sin ningún criterio objetivo"],
            correctIndex: 1,
          },
          {
            skill: "Seguridad social",
            question: "En la mayoría de países de LATAM, ¿qué componentes suele incluir el sistema de seguridad social del trabajador?",
            options: ["Solo un seguro de vida opcional", "Salud, pensión y riesgos laborales, entre otros", "Únicamente vacaciones pagadas", "Solo aplica a trabajadores independientes"],
            correctIndex: 1,
          },
          {
            skill: "Compensación y beneficios",
            question: "¿Qué diferencia existe entre compensación 'directa' e 'indirecta' (beneficios)?",
            options: ["No existe ninguna diferencia real", "La directa es el salario y bonos monetarios; la indirecta incluye beneficios no monetarios como seguros o flexibilidad laboral", "La indirecta siempre es mayor que la directa", "Ambas se refieren exclusivamente al salario base"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "reclutamiento-seleccion",
        label: "Reclutamiento y Selección",
        matchKeywords: ["reclutamiento", "selección de personal", "headhunting"],
        disciplinarySkills: ["Entrevistas por competencias", "Pruebas psicotécnicas", "Búsqueda de talento", "Onboarding"],
        knowledgeQuestions: [
          {
            skill: "Entrevistas por competencias",
            question: "¿En qué se basa principalmente una entrevista por competencias?",
            options: ["Preguntas genéricas sin relación con el cargo", "Preguntas sobre comportamientos y experiencias pasadas que evidencian competencias específicas requeridas para el cargo", "Solo evaluar la apariencia física del candidato", "Preguntar exclusivamente sobre pretensiones salariales"],
            correctIndex: 1,
          },
          {
            skill: "Pruebas psicotécnicas",
            question: "¿Qué buscan medir principalmente las pruebas psicotécnicas en selección de personal?",
            options: ["Solo el nivel de estudios formales del candidato", "Aptitudes, habilidades cognitivas y rasgos de personalidad relevantes para el cargo", "El aspecto físico del candidato", "Las relaciones familiares del candidato"],
            correctIndex: 1,
          },
          {
            skill: "Búsqueda de talento",
            question: "¿Qué estrategia se conoce como 'headhunting' o búsqueda directa de talento?",
            options: ["Esperar pasivamente a que lleguen hojas de vida", "La búsqueda activa y proactiva de candidatos específicos, muchas veces ya empleados en otras organizaciones", "Publicar solo en un periódico local", "Contratar al primer candidato disponible sin evaluación"],
            correctIndex: 1,
          },
          {
            skill: "Onboarding",
            question: "¿Cuál es el objetivo principal de un buen proceso de onboarding (inducción)?",
            options: ["Dejar al nuevo empleado sin ninguna orientación desde el primer día", "Facilitar la integración del nuevo empleado a la cultura, procesos y equipo de la organización", "Evaluar inmediatamente el despido del nuevo empleado", "Es un proceso que solo dura una hora sin seguimiento"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "desarrollo-organizacional",
        label: "Desarrollo Organizacional",
        matchKeywords: ["desarrollo organizacional", "capacitación", "formación de personal"],
        disciplinarySkills: ["Diseño de programas de capacitación", "Gestión del cambio organizacional", "Evaluación de desempeño", "Planes de carrera"],
        knowledgeQuestions: [
          {
            skill: "Diseño de programas de capacitación",
            question: "¿Qué paso es fundamental antes de diseñar un programa de capacitación?",
            options: ["Diseñar el contenido sin ningún diagnóstico previo", "Realizar un diagnóstico de necesidades de capacitación (DNC)", "Copiar un programa genérico sin adaptarlo", "Omitir cualquier evaluación de resultados posterior"],
            correctIndex: 1,
          },
          {
            skill: "Gestión del cambio organizacional",
            question: "¿Por qué es importante la comunicación clara durante un proceso de cambio organizacional?",
            options: ["No es relevante para el éxito del cambio", "Reduce la incertidumbre y resistencia de los colaboradores frente al cambio", "Solo debe comunicarse a la alta gerencia", "Debe evitarse para no generar expectativas"],
            correctIndex: 1,
          },
          {
            skill: "Evaluación de desempeño",
            question: "¿Qué característica debe tener un buen sistema de evaluación de desempeño?",
            options: ["Ser subjetivo y basado solo en la simpatía personal", "Ser objetivo, basado en criterios claros y conocidos previamente por el evaluado", "Realizarse sin retroalimentación al empleado", "No tener ninguna relación con los objetivos del cargo"],
            correctIndex: 1,
          },
          {
            skill: "Planes de carrera",
            question: "¿Qué busca un plan de carrera dentro de una organización?",
            options: ["Mantener a todos los empleados en el mismo cargo indefinidamente", "Definir una ruta de crecimiento profesional y desarrollo de competencias dentro de la empresa", "Eliminar cualquier posibilidad de ascenso", "Aplicar solo a los cargos directivos"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "relaciones-laborales",
        label: "Relaciones Laborales",
        matchKeywords: ["relaciones laborales", "sindicato", "negociación colectiva"],
        disciplinarySkills: ["Normatividad laboral", "Negociación colectiva", "Manejo de conflictos laborales", "Comités de convivencia"],
        knowledgeQuestions: [
          {
            skill: "Normatividad laboral",
            question: "¿Qué regula principalmente la normatividad laboral de un país?",
            options: ["Solo los impuestos de las empresas", "Los derechos y obligaciones entre empleadores y trabajadores", "Exclusivamente el comercio internacional", "Los precios de los productos en el mercado"],
            correctIndex: 1,
          },
          {
            skill: "Negociación colectiva",
            question: "¿Qué es un 'pliego de peticiones' en el contexto de negociación colectiva?",
            options: ["Un documento de despido masivo", "El documento formal donde los trabajadores presentan sus solicitudes al empleador en una negociación colectiva", "Un contrato individual de trabajo", "Un reglamento interno de la empresa"],
            correctIndex: 1,
          },
          {
            skill: "Manejo de conflictos laborales",
            question: "¿Cuál es un enfoque recomendado para el manejo efectivo de conflictos laborales?",
            options: ["Ignorar el conflicto esperando que se resuelva solo", "Identificar la causa raíz, facilitar el diálogo y buscar soluciones de mutuo beneficio", "Tomar partido automáticamente por una de las partes sin escuchar a la otra", "Escalar inmediatamente a despido sin investigación"],
            correctIndex: 1,
          },
          {
            skill: "Comités de convivencia",
            question: "¿Cuál es la función principal de un comité de convivencia laboral?",
            options: ["Organizar eventos sociales de la empresa exclusivamente", "Prevenir y gestionar situaciones de acoso laboral y promover un ambiente de trabajo sano", "Aprobar los presupuestos de la empresa", "Reemplazar al departamento de recursos humanos por completo"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Marketing de Contenidos", "Inteligencia Artificial en Marketing", "Comunicación Digital", "Marca Personal", "Marketing de Influencers"],
    behaviorQuestions: [
      {
        skill: "Estrategia de contenido",
        question: "¿Con qué frecuencia planificas contenido con una estrategia definida (calendario, objetivos, audiencia)?",
        options: ["Nunca planifico, publico de forma improvisada", "Rara vez", "A veces", "Frecuentemente", "Siempre, sigo una estrategia de contenido estructurada"],
      },
      {
        skill: "Redes sociales",
        question: "¿Con qué frecuencia gestionas activamente redes sociales para una marca o negocio?",
        options: ["Nunca las gestiono", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte central de mi trabajo diario"],
      },
      {
        skill: "SEO/SEM",
        question: "¿Qué tan cómodo/a te sientes aplicando técnicas de SEO o gestionando campañas SEM?",
        options: ["Nada cómodo/a", "Poco cómodo/a", "Medianamente cómodo/a", "Cómodo/a", "Muy cómodo/a, tengo experiencia sólida y resultados medibles"],
      },
      {
        skill: "Analítica digital",
        question: "¿Con qué frecuencia analizas métricas digitales (Google Analytics, redes sociales) para tomar decisiones?",
        options: ["Nunca analizo métricas", "Rara vez", "A veces", "Frecuentemente", "Siempre, las métricas guían mis decisiones de forma sistemática"],
      },
      {
        skill: "Campañas publicitarias",
        question: "¿Con qué frecuencia diseñas o ejecutas campañas publicitarias completas?",
        options: ["Nunca lo hago", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una responsabilidad regular mía"],
      },
    ],
    specialties: [
      {
        id: "marketing-digital-performance",
        label: "Marketing Digital y Performance",
        matchKeywords: ["marketing digital", "performance", "pauta digital", "google ads", "meta ads"],
        disciplinarySkills: ["Publicidad digital (Google/Meta Ads)", "SEO/SEM", "Analítica web", "Marketing de performance"],
        knowledgeQuestions: [
          {
            skill: "Publicidad digital (Google/Meta Ads)",
            question: "¿Qué modelo de pago es común en plataformas como Google Ads, donde se paga solo cuando alguien hace clic en el anuncio?",
            options: ["CPM (costo por mil impresiones)", "CPC (costo por clic)", "Suscripción mensual fija", "Pago único anual"],
            correctIndex: 1,
          },
          {
            skill: "SEO/SEM",
            question: "¿Cuál es la diferencia principal entre SEO y SEM?",
            options: ["Son términos idénticos sin ninguna diferencia", "El SEO busca posicionamiento orgánico gratuito; el SEM incluye publicidad paga en buscadores", "El SEM nunca requiere inversión económica", "El SEO solo aplica a redes sociales"],
            correctIndex: 1,
          },
          {
            skill: "Analítica web",
            question: "¿Qué mide la 'tasa de rebote' (bounce rate) en analítica web?",
            options: ["El número total de ventas de un sitio", "El porcentaje de visitantes que abandonan el sitio tras ver solo una página sin interactuar más", "La velocidad de carga del sitio web", "El número de empleados que gestionan el sitio"],
            correctIndex: 1,
          },
          {
            skill: "Marketing de performance",
            question: "¿Qué caracteriza principalmente al marketing de performance?",
            options: ["Se enfoca solo en la creatividad sin medir resultados", "Se enfoca en resultados medibles y accionables (conversiones, ventas, leads) para optimizar la inversión", "Nunca utiliza datos ni métricas", "Es idéntico al marketing de marca tradicional"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "comunicacion-corporativa",
        label: "Comunicación Corporativa y RRPP",
        matchKeywords: ["comunicación corporativa", "relaciones públicas", "prensa"],
        disciplinarySkills: ["Relaciones públicas", "Comunicación institucional", "Manejo de crisis", "Redacción corporativa"],
        knowledgeQuestions: [
          {
            skill: "Relaciones públicas",
            question: "¿Cuál es un objetivo central de las relaciones públicas para una organización?",
            options: ["Manipular a la opinión pública sin ninguna base real", "Construir y mantener una reputación e imagen positiva ante los públicos de interés (stakeholders)", "Evitar cualquier comunicación con los medios", "Solo enfocarse en la publicidad pagada"],
            correctIndex: 1,
          },
          {
            skill: "Comunicación institucional",
            question: "¿A qué se refiere principalmente la comunicación institucional o corporativa?",
            options: ["Solo a la comunicación entre amigos dentro de la empresa", "A la gestión estratégica de los mensajes que una organización transmite a sus públicos internos y externos", "Únicamente a la publicidad de productos", "A la comunicación exclusivamente informal por redes sociales personales"],
            correctIndex: 1,
          },
          {
            skill: "Manejo de crisis",
            question: "¿Cuál es un principio fundamental en la comunicación durante una crisis organizacional?",
            options: ["Guardar silencio total y no comunicar nada", "Actuar con transparencia, rapidez y coherencia en los mensajes emitidos", "Negar cualquier responsabilidad sin evaluar los hechos", "Esperar varias semanas antes de emitir cualquier comunicado"],
            correctIndex: 1,
          },
          {
            skill: "Redacción corporativa",
            question: "¿Qué característica debe tener la redacción de un comunicado corporativo efectivo?",
            options: ["Ser ambiguo y poco claro intencionalmente", "Ser clara, concisa y alineada con el tono y valores de la marca", "Usar el mayor número de tecnicismos posible", "No requiere revisión antes de publicarse"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "diseno-branding",
        label: "Diseño y Branding",
        matchKeywords: ["diseño gráfico", "branding", "identidad de marca"],
        disciplinarySkills: ["Diseño de marca", "Identidad visual", "Herramientas de diseño (Adobe)", "Branding estratégico"],
        knowledgeQuestions: [
          {
            skill: "Diseño de marca",
            question: "¿Qué elementos suele incluir el diseño integral de una marca?",
            options: ["Solo el nombre de la empresa", "Logotipo, paleta de colores, tipografía y elementos visuales coherentes entre sí", "Únicamente el eslogan publicitario", "Solo se aplica a productos físicos, nunca a servicios"],
            correctIndex: 1,
          },
          {
            skill: "Identidad visual",
            question: "¿Por qué es importante la consistencia en la identidad visual de una marca?",
            options: ["No es relevante para el reconocimiento de marca", "Genera reconocimiento, confianza y coherencia en la percepción del público", "Solo importa en el empaque del producto", "Debe cambiar completamente cada mes"],
            correctIndex: 1,
          },
          {
            skill: "Herramientas de diseño (Adobe)",
            question: "¿Cuál de estas herramientas de Adobe se usa principalmente para diseño vectorial (ej. logotipos)?",
            options: ["Adobe Illustrator", "Adobe Premiere Pro", "Adobe Audition", "Adobe Acrobat Reader"],
            correctIndex: 0,
          },
          {
            skill: "Branding estratégico",
            question: "¿Qué busca principalmente el branding estratégico más allá del diseño visual?",
            options: ["Solo crear un logo atractivo sin ninguna estrategia detrás", "Construir una propuesta de valor y posicionamiento diferenciado y coherente en la mente del consumidor", "Cambiar de nombre la empresa constantemente", "Ignorar a la competencia por completo"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "investigacion-mercados",
        label: "Investigación de Mercados",
        matchKeywords: ["investigación de mercados", "estudios de mercado"],
        disciplinarySkills: ["Diseño de encuestas", "Análisis de consumidor", "Estudios de mercado", "Segmentación de mercado"],
        knowledgeQuestions: [
          {
            skill: "Diseño de encuestas",
            question: "¿Qué característica debe evitarse al redactar preguntas de una encuesta?",
            options: ["Preguntas claras y neutrales", "Preguntas sesgadas que induzcan una respuesta específica", "Un lenguaje sencillo y directo", "Opciones de respuesta bien definidas"],
            correctIndex: 1,
          },
          {
            skill: "Análisis de consumidor",
            question: "¿Qué busca comprender el análisis del comportamiento del consumidor?",
            options: ["Solo el precio que paga el consumidor", "Los factores psicológicos, sociales y culturales que influyen en las decisiones de compra", "Únicamente los datos demográficos básicos", "Nada relacionado con la decisión de compra"],
            correctIndex: 1,
          },
          {
            skill: "Estudios de mercado",
            question: "¿Cuál es la diferencia entre una investigación de mercado cualitativa y una cuantitativa?",
            options: ["No existe ninguna diferencia", "La cualitativa explora percepciones y motivaciones en profundidad; la cuantitativa mide y generaliza con datos numéricos", "La cuantitativa nunca usa encuestas", "La cualitativa siempre requiere miles de participantes"],
            correctIndex: 1,
          },
          {
            skill: "Segmentación de mercado",
            question: "¿Qué es la segmentación de mercado?",
            options: ["Vender el mismo producto de la misma forma a todo el público sin distinción", "Dividir un mercado en grupos con necesidades, características o comportamientos similares para dirigir estrategias específicas", "Un proceso legal para registrar una marca", "Solo aplica a mercados internacionales"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Logística Sostenible", "Automatización y Robótica", "Comercio Electrónico y Última Milla", "Analítica de Operaciones", "Cadena de Suministro Global"],
    behaviorQuestions: [
      {
        skill: "Gestión de inventarios",
        question: "¿Con qué frecuencia realizas seguimiento y control activo de los niveles de inventario?",
        options: ["Nunca hago seguimiento", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo un sistema de control riguroso"],
      },
      {
        skill: "Cadena de suministro",
        question: "¿Con qué frecuencia coordinas con proveedores o eslabones de la cadena de suministro?",
        options: ["Nunca coordino con la cadena de suministro", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte central de mi rol"],
      },
      {
        skill: "Optimización de procesos",
        question: "¿Con qué frecuencia identificas e implementas mejoras en los procesos operativos?",
        options: ["Nunca lo hago", "Rara vez", "A veces", "Frecuentemente", "Siempre, busco mejora continua de forma sistemática"],
      },
      {
        skill: "Control de calidad",
        question: "¿Con qué frecuencia aplicas controles de calidad formales en tu trabajo?",
        options: ["Nunca aplico controles de calidad", "Rara vez", "A veces", "Frecuentemente", "Siempre, sigo un proceso riguroso de control de calidad"],
      },
      {
        skill: "Indicadores de gestión (KPI)",
        question: "¿Con qué frecuencia mides y analizas indicadores de gestión (KPI) en tu área?",
        options: ["Nunca mido indicadores", "Rara vez", "A veces", "Frecuentemente", "Siempre, reviso KPIs de forma sistemática y periódica"],
      },
    ],
    specialties: [
      {
        id: "cadena-suministro",
        label: "Cadena de Suministro",
        matchKeywords: ["cadena de suministro", "supply chain"],
        disciplinarySkills: ["Gestión de la cadena de suministro", "Planeación de la demanda", "Compras y abastecimiento", "Indicadores de supply chain"],
        knowledgeQuestions: [
          {
            skill: "Gestión de la cadena de suministro",
            question: "¿Qué abarca la gestión de la cadena de suministro (supply chain management)?",
            options: ["Solo el transporte final al cliente", "La coordinación integral desde proveedores de materia prima hasta la entrega del producto final al cliente", "Únicamente la producción en fábrica", "Solo la parte financiera de una empresa"],
            correctIndex: 1,
          },
          {
            skill: "Planeación de la demanda",
            question: "¿Por qué es importante una buena planeación de la demanda?",
            options: ["No tiene ningún impacto en el inventario", "Permite anticipar las necesidades futuras y evitar tanto excesos como faltantes de inventario", "Solo sirve para fijar precios", "Es un proceso que se hace una sola vez al inicio de la empresa"],
            correctIndex: 1,
          },
          {
            skill: "Compras y abastecimiento",
            question: "¿Qué factor es clave al seleccionar un proveedor estratégico?",
            options: ["Solo el precio más bajo sin considerar nada más", "Un balance entre calidad, precio, confiabilidad y capacidad de cumplimiento", "La cercanía geográfica exclusivamente", "El tamaño de la empresa proveedora únicamente"],
            correctIndex: 1,
          },
          {
            skill: "Indicadores de supply chain",
            question: "¿Qué mide el indicador OTIF (On Time In Full) en logística?",
            options: ["El costo total de la nómina", "El porcentaje de pedidos entregados a tiempo y de forma completa", "La satisfacción del cliente con el servicio al cliente", "El número de empleados en el almacén"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "transporte-distribucion",
        label: "Transporte y Distribución",
        matchKeywords: ["transporte", "distribución", "flota"],
        disciplinarySkills: ["Gestión de flotas", "Ruteo y distribución", "Costos de transporte", "Normatividad de transporte de carga"],
        knowledgeQuestions: [
          {
            skill: "Gestión de flotas",
            question: "¿Qué aspecto es fundamental en la gestión eficiente de una flota de transporte?",
            options: ["Ignorar el mantenimiento preventivo de los vehículos", "El mantenimiento preventivo, control de combustible y monitoreo de los vehículos", "Contratar conductores sin ninguna verificación", "No es necesario ningún seguimiento de rutas"],
            correctIndex: 1,
          },
          {
            skill: "Ruteo y distribución",
            question: "¿Qué busca optimizar principalmente el diseño de rutas de distribución?",
            options: ["Aumentar el tiempo de entrega sin ningún criterio", "Minimizar distancias, tiempos y costos mientras se cumplen los tiempos de entrega prometidos", "Ignorar el número de pedidos a entregar", "Usar siempre la misma ruta sin importar el destino"],
            correctIndex: 1,
          },
          {
            skill: "Costos de transporte",
            question: "¿Qué componente NO suele considerarse un costo directo de transporte?",
            options: ["Combustible", "Peajes", "El costo de publicidad en redes sociales de la empresa", "Mantenimiento del vehículo"],
            correctIndex: 2,
          },
          {
            skill: "Normatividad de transporte de carga",
            question: "¿Por qué es importante cumplir la normatividad de pesos y dimensiones en el transporte de carga terrestre?",
            options: ["No tiene ninguna relevancia legal ni de seguridad", "Garantiza la seguridad vial y evita sanciones legales o daños a la infraestructura", "Solo afecta el consumo de combustible", "Es una recomendación opcional sin consecuencias"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "produccion-manufactura",
        label: "Producción y Manufactura",
        matchKeywords: ["producción", "manufactura", "planta"],
        disciplinarySkills: ["Planeación de producción", "Manufactura esbelta (Lean)", "Mantenimiento industrial", "Seguridad industrial"],
        knowledgeQuestions: [
          {
            skill: "Planeación de producción",
            question: "¿Qué busca la planeación de producción en una planta de manufactura?",
            options: ["Producir sin ningún plan ni orden específico", "Coordinar recursos, tiempos y capacidad para cumplir la demanda de forma eficiente", "Ignorar los pedidos de los clientes", "Solo importa el número de empleados contratados"],
            correctIndex: 1,
          },
          {
            skill: "Manufactura esbelta (Lean)",
            question: "¿Cuál es el principio central de la manufactura esbelta (Lean Manufacturing)?",
            options: ["Maximizar el desperdicio de recursos", "Eliminar desperdicios y actividades que no agregan valor al proceso productivo", "Aumentar el inventario todo lo posible como buffer", "Ignorar la satisfacción del cliente"],
            correctIndex: 1,
          },
          {
            skill: "Mantenimiento industrial",
            question: "¿Qué diferencia existe entre mantenimiento preventivo y correctivo?",
            options: ["Son exactamente lo mismo", "El preventivo se realiza de forma planificada para evitar fallas; el correctivo se hace después de que ocurre una falla", "El correctivo siempre es más económico que el preventivo", "El preventivo solo aplica a maquinaria nueva"],
            correctIndex: 1,
          },
          {
            skill: "Seguridad industrial",
            question: "¿Cuál es el objetivo principal de un programa de seguridad industrial en una planta?",
            options: ["Cumplir solo un requisito burocrático sin impacto real", "Prevenir accidentes laborales y proteger la salud e integridad de los trabajadores", "Aumentar la producción sin importar los riesgos", "Solo aplica a cargos administrativos"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "control-calidad",
        label: "Control de Calidad",
        matchKeywords: ["control de calidad", "aseguramiento de calidad", "iso"],
        disciplinarySkills: ["Normas ISO", "Control estadístico de calidad", "Auditorías de calidad", "Gestión de no conformidades"],
        knowledgeQuestions: [
          {
            skill: "Normas ISO",
            question: "¿Qué certifica principalmente la norma ISO 9001?",
            options: ["La sostenibilidad ambiental de una empresa", "Un sistema de gestión de calidad efectivo dentro de una organización", "La seguridad informática de una empresa", "Los estados financieros de una empresa"],
            correctIndex: 1,
          },
          {
            skill: "Control estadístico de calidad",
            question: "¿Para qué se utilizan las gráficas de control en control estadístico de calidad?",
            options: ["Para decorar reportes sin ninguna utilidad práctica", "Para monitorear si un proceso se mantiene dentro de límites de variación aceptables a lo largo del tiempo", "Para calcular el salario de los empleados", "Para diseñar el logo de la empresa"],
            correctIndex: 1,
          },
          {
            skill: "Auditorías de calidad",
            question: "¿Cuál es el propósito de una auditoría de calidad interna?",
            options: ["Sancionar automáticamente a los empleados", "Verificar el cumplimiento del sistema de gestión de calidad y detectar oportunidades de mejora", "Reemplazar la certificación externa", "No tiene ninguna relación con la mejora continua"],
            correctIndex: 1,
          },
          {
            skill: "Gestión de no conformidades",
            question: "¿Qué es una 'no conformidad' en un sistema de gestión de calidad?",
            options: ["Un logro destacado de la empresa", "El incumplimiento de un requisito especificado dentro del sistema de calidad", "Un tipo de certificado de calidad", "Una promoción de ventas"],
            correctIndex: 1,
          },
        ],
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
    interestAreas: ["Derecho Digital y Protección de Datos", "Legaltech", "Compliance y Ética Corporativa", "Arbitraje y Resolución de Conflictos", "Sostenibilidad y ESG Legal"],
    behaviorQuestions: [
      {
        skill: "Redacción de contratos",
        question: "¿Con qué frecuencia redactas o revisas contratos de forma directa?",
        options: ["Nunca redacto ni reviso contratos", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una tarea regular en mi rol"],
      },
      {
        skill: "Litigio",
        question: "¿Con qué frecuencia representas o participas en procesos de litigio?",
        options: ["Nunca participo en litigios", "Rara vez", "A veces", "Frecuentemente", "Siempre, es parte central de mi práctica"],
      },
      {
        skill: "Cumplimiento normativo",
        question: "¿Con qué frecuencia realizas revisiones de cumplimiento normativo (compliance) en tu trabajo?",
        options: ["Nunca las realizo", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una responsabilidad sistemática mía"],
      },
      {
        skill: "Asesoría legal",
        question: "¿Con qué frecuencia brindas asesoría legal directa a clientes o a tu organización?",
        options: ["Nunca brindo asesoría legal", "Rara vez", "A veces", "Frecuentemente", "Siempre, es mi actividad principal"],
      },
      {
        skill: "Derecho corporativo",
        question: "¿Qué tan familiarizado/a estás con los procesos de gobierno corporativo y constitución de sociedades?",
        options: ["Nada familiarizado/a", "Poco familiarizado/a", "Medianamente familiarizado/a", "Familiarizado/a", "Muy familiarizado/a, tengo experiencia sólida en el tema"],
      },
    ],
    specialties: [
      {
        id: "derecho-laboral",
        label: "Derecho Laboral",
        matchKeywords: ["derecho laboral", "laboralista"],
        disciplinarySkills: ["Contratación laboral", "Liquidación de prestaciones sociales", "Litigios laborales", "Normatividad laboral"],
        knowledgeQuestions: [
          {
            skill: "Contratación laboral",
            question: "¿Qué elemento es esencial para que exista una relación laboral según el derecho laboral?",
            options: ["Solo el pago de un salario sin ninguna otra condición", "La prestación personal del servicio, la subordinación y la remuneración (salario)", "Únicamente un contrato firmado sin importar las condiciones reales", "La existencia de un local comercial"],
            correctIndex: 1,
          },
          {
            skill: "Liquidación de prestaciones sociales",
            question: "En muchos países de LATAM, ¿qué concepto suele incluirse comúnmente en la liquidación de prestaciones sociales de un trabajador?",
            options: ["Solo el salario del último mes", "Cesantías, prima e intereses sobre cesantías, entre otros según la legislación local", "Un bono discrecional sin obligación legal", "Solo aplica si el trabajador es despedido sin justa causa"],
            correctIndex: 1,
          },
          {
            skill: "Litigios laborales",
            question: "¿Qué instancia se utiliza generalmente para resolver un conflicto laboral antes o en lugar de un litigio judicial?",
            options: ["La conciliación o mediación laboral", "Nunca existe otra vía distinta al litigio judicial", "Solo se puede resolver mediante huelga", "Siempre debe resolverse fuera del país"],
            correctIndex: 0,
          },
          {
            skill: "Normatividad laboral",
            question: "¿Qué código o cuerpo normativo regula generalmente las relaciones laborales en la mayoría de países de LATAM?",
            options: ["El Código Penal exclusivamente", "Un Código Sustantivo del Trabajo o legislación laboral equivalente del país", "El Código Civil de comercio internacional", "No existe ninguna normativa laboral formal"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "derecho-penal",
        label: "Derecho Penal",
        matchKeywords: ["derecho penal", "penalista", "litigio penal"],
        disciplinarySkills: ["Procedimiento penal", "Defensa penal", "Investigación criminal", "Audiencias penales"],
        knowledgeQuestions: [
          {
            skill: "Procedimiento penal",
            question: "¿Cuál es un principio fundamental del debido proceso penal?",
            options: ["La presunción de culpabilidad hasta que se demuestre lo contrario", "La presunción de inocencia hasta que se demuestre la culpabilidad", "Que el juicio se resuelva sin ninguna prueba", "Que el acusado no tenga derecho a defensa"],
            correctIndex: 1,
          },
          {
            skill: "Defensa penal",
            question: "¿Cuál es el rol principal de la defensa en un proceso penal?",
            options: ["Buscar la condena del propio cliente", "Garantizar el derecho de defensa y el debido proceso del acusado", "Actuar como juez del caso", "No tiene ninguna función formal en el proceso"],
            correctIndex: 1,
          },
          {
            skill: "Investigación criminal",
            question: "¿Qué principio es esencial en la cadena de custodia de la evidencia en una investigación criminal?",
            options: ["No es necesario ningún registro de la evidencia", "Garantizar que la evidencia se preserve sin alteración desde su recolección hasta su presentación en juicio", "Cualquier persona puede manipular la evidencia libremente", "La evidencia puede desecharse sin justificación"],
            correctIndex: 1,
          },
          {
            skill: "Audiencias penales",
            question: "¿Qué es una audiencia de imputación de cargos en el proceso penal?",
            options: ["El momento final donde se dicta sentencia", "El acto donde la fiscalía comunica formalmente al indiciado los cargos que se le imputan", "Una reunión informal sin efectos legales", "Solo aplica en procesos civiles"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "derecho-civil-comercial",
        label: "Derecho Civil y Comercial",
        matchKeywords: ["derecho civil", "derecho comercial", "contratos civiles"],
        disciplinarySkills: ["Redacción de contratos civiles y comerciales", "Derecho societario", "Procesos civiles", "Cobro jurídico"],
        knowledgeQuestions: [
          {
            skill: "Redacción de contratos civiles y comerciales",
            question: "¿Qué elemento es esencial para la validez de un contrato?",
            options: ["Que esté escrito en un idioma extranjero", "El consentimiento de las partes, un objeto lícito y una causa lícita", "Que tenga más de 10 páginas", "Que sea firmado ante notario en todos los casos sin excepción"],
            correctIndex: 1,
          },
          {
            skill: "Derecho societario",
            question: "¿Qué diferencia principal existe entre una sociedad anónima y una sociedad de responsabilidad limitada?",
            options: ["No existe ninguna diferencia legal", "Difieren principalmente en la estructura de capital (acciones vs. cuotas) y el régimen de responsabilidad de los socios", "La sociedad anónima nunca puede tener más de un socio", "La responsabilidad limitada siempre implica responsabilidad ilimitada de los socios"],
            correctIndex: 1,
          },
          {
            skill: "Procesos civiles",
            question: "¿Qué caracteriza a un proceso civil frente a uno penal?",
            options: ["Son exactamente iguales en todo sentido", "El proceso civil resuelve conflictos entre particulares (ej. contratos, propiedad); el penal juzga delitos con potencial sanción del Estado", "El proceso civil siempre termina en prisión", "El proceso penal nunca requiere pruebas"],
            correctIndex: 1,
          },
          {
            skill: "Cobro jurídico",
            question: "¿Qué es el 'cobro jurídico' o cobro judicial de una deuda?",
            options: ["Un acuerdo informal sin ninguna consecuencia legal", "El proceso legal formal para exigir el pago de una obligación a través de instancias judiciales", "Solo aplica a deudas del gobierno", "Un tipo de seguro contra impagos"],
            correctIndex: 1,
          },
        ],
      },
      {
        id: "derecho-corporativo-tributario",
        label: "Derecho Corporativo y Tributario",
        matchKeywords: ["derecho corporativo", "derecho tributario", "compliance"],
        disciplinarySkills: ["Derecho corporativo", "Cumplimiento normativo (compliance)", "Derecho tributario", "Fusiones y adquisiciones"],
        knowledgeQuestions: [
          {
            skill: "Derecho corporativo",
            question: "¿Qué área regula principalmente el derecho corporativo?",
            options: ["Solo los conflictos familiares", "La constitución, funcionamiento, gobierno y disolución de sociedades y empresas", "Exclusivamente el derecho penal internacional", "Los contratos de arrendamiento residencial"],
            correctIndex: 1,
          },
          {
            skill: "Cumplimiento normativo (compliance)",
            question: "¿Cuál es el objetivo principal de un programa de compliance en una empresa?",
            options: ["Evadir la regulación de forma más sofisticada", "Asegurar que la organización cumpla con las leyes, regulaciones y estándares éticos aplicables", "Aumentar las ganancias sin ninguna consideración legal", "Solo aplica a empresas del sector financiero"],
            correctIndex: 1,
          },
          {
            skill: "Derecho tributario",
            question: "¿Qué distingue al derecho tributario de otras ramas del derecho?",
            options: ["No tiene relación con el Estado", "Regula la relación jurídica entre el Estado y los contribuyentes respecto a los tributos", "Solo aplica a personas naturales, nunca a empresas", "Es idéntico al derecho laboral"],
            correctIndex: 1,
          },
          {
            skill: "Fusiones y adquisiciones",
            question: "¿Qué implica una operación de 'fusión' entre dos empresas?",
            options: ["La simple firma de un contrato de arrendamiento", "La unión de dos o más empresas para formar una sola entidad, combinando sus patrimonios y operaciones", "La venta de un solo producto entre empresas", "Un tipo de despido colectivo"],
            correctIndex: 1,
          },
        ],
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
  interestAreas: ["IA y Tecnología", "Marketing Digital", "Liderazgo", "Finanzas", "Emprendimiento", "Salud Digital"],
  behaviorQuestions: [
    {
      skill: "Trabajo en equipo",
      question: "¿Con qué frecuencia colaboras activamente con otros para lograr un objetivo común en tu trabajo?",
      options: ["Nunca colaboro con otros", "Rara vez", "A veces", "Frecuentemente", "Siempre, el trabajo en equipo es central en mi día a día"],
    },
    {
      skill: "Orientación a resultados",
      question: "¿Con qué frecuencia estableces y das seguimiento a metas concretas en tu trabajo?",
      options: ["Nunca establezco metas", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo un sistema claro de metas y seguimiento"],
    },
    {
      skill: "Comunicación",
      question: "¿Con qué frecuencia te aseguras de que tus mensajes sean claros y bien entendidos por otros?",
      options: ["Nunca me preocupo por esto", "Rara vez", "A veces", "Frecuentemente", "Siempre, es una prioridad constante para mí"],
    },
    {
      skill: "Organización",
      question: "¿Con qué frecuencia planificas y organizas tus tareas con anticipación?",
      options: ["Nunca planifico, trabajo de forma reactiva", "Rara vez", "A veces", "Frecuentemente", "Siempre, tengo un sistema de organización estructurado"],
    },
  ],
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
