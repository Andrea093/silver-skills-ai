export interface FinancialTopic {
  id: string;
  title: string;
  summary: string;
  mentorPrompt: string;
}

// Fixed MVP content per spec — short, accordion-style, plain language ("Sabio + Amigo" tone).
export const FINANCIAL_TOPICS: FinancialTopic[] = [
  {
    id: "rpm-vs-rais",
    title: "¿Qué diferencia hay entre RPM y RAIS?",
    summary:
      "El RPM (Régimen de Prima Media) es un fondo público común: tu pensión depende de tus semanas cotizadas y tu salario base, con un tope fijo. El RAIS (Régimen de Ahorro Individual) es una cuenta personal: tu pensión depende de cuánto ahorraste y cómo rindió esa plata. No hay uno \"mejor\" para todos — depende de tu historia laboral y cuánto te falta para pensionarte.",
    mentorPrompt: "Explícame en palabras simples la diferencia entre RPM y RAIS, y cuál me conviene más según mi situación.",
  },
  {
    id: "ahorro-voluntario",
    title: "¿Qué es el ahorro voluntario y cómo empiezo con poco?",
    summary:
      "Es dinero adicional que aportas por tu cuenta, aparte de lo obligatorio, para aumentar tu pensión futura. No necesitas montos grandes: muchos fondos permiten empezar con aportes pequeños y periódicos. Lo importante es la constancia, no el monto inicial.",
    mentorPrompt: "¿Cómo empiezo a hacer ahorro voluntario para mi pensión si solo puedo aportar montos bajos?",
  },
  {
    id: "informalidad",
    title: "¿Cómo afecta la informalidad a mi pensión futura?",
    summary:
      "Cuando trabajas de forma informal, esas semanas no se cotizan — no cuentan para tu pensión, sin importar cuánto tiempo hayas trabajado así. En Latinoamérica más del 50% de los trabajadores mayores de 45 años ha pasado por informalidad en algún momento, lo que reduce directamente su proyección. Formalizarte, aunque sea en una etapa posterior de tu carrera, ayuda a recuperar terreno.",
    mentorPrompt: "He trabajado varios años de manera informal. ¿Cómo afecta esto mi pensión y qué puedo hacer ahora?",
  },
  {
    id: "semanas-faltantes",
    title: "Estoy cerca de la edad de pensión y me faltan semanas cotizadas, ¿qué hago?",
    summary:
      "Tienes varias opciones reales: seguir cotizando el tiempo que haga falta (incluso de forma independiente), hacer un traslado de régimen si aplica en tu caso, o consultar una indemnización sustitutiva o devolución de saldos si no vas a alcanzar las semanas mínimas. Cada caso es distinto — un asesor de tu fondo de pensiones te puede confirmar cuál aplica al tuyo.",
    mentorPrompt: "Estoy cerca de la edad de pensión y me faltan semanas cotizadas. ¿Qué opciones reales tengo?",
  },
];
