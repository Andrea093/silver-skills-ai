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
    title: "¿Qué diferencia hay entre RPM y RAIS, y cuál es el mío?",
    summary:
      "El RPM (Régimen de Prima Media, administrado por Colpensiones) es un fondo público común: tu pensión depende de tus semanas cotizadas y tu salario base, con un tope fijo. El RAIS (Régimen de Ahorro Individual, administrado por fondos privados como Porvenir, Protección o Colfondos) es una cuenta personal: tu pensión depende de cuánto ahorraste y cómo rindió esa plata.\n\n¿Cómo sé en cuál estoy? Revisa el nombre de la entidad en tu desprendible de pago o certificado laboral — si dice \"Colpensiones\" estás en RPM; si dice Porvenir, Protección, Colfondos u otro fondo privado, estás en RAIS. Si no lo tienes a la mano, puedes consultarlo gratis en la página de Colpensiones o llamando a tu fondo.\n\n¿Cómo decido si me conviene cambiar? Como regla general: si te faltan pocos años y ya tienes muchas semanas cotizadas, cambiar rara vez conviene. Si te faltan muchos años, vale la pena comparar con un asesor de tu fondo actual — es una decisión importante que no deberías tomar solo con esta guía.",
    mentorPrompt: "Explícame en palabras simples la diferencia entre RPM y RAIS, cómo puedo saber en cuál estoy, y qué debería considerar si estoy pensando en cambiar.",
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
