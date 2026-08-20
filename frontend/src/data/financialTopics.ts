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
  {
    id: "distribuir-ingreso",
    title: "¿Cómo distribuyo mi ingreso mensual de forma sencilla?",
    summary:
      "Una regla simple y conocida para empezar (ajústala a tu realidad, no es una fórmula rígida): 50% para lo esencial (vivienda, comida, servicios, deudas mínimas), 30% para lo que quieras (ocio, gustos, familia) y 20% para ahorro y aportes voluntarios a tu pensión. Si hoy no te alcanza para ese 20%, no pasa nada — empieza con lo que puedas, aunque sea 5%, y ve subiendo el porcentaje según mejore tu ingreso. Lo que importa es tener la costumbre de separar algo antes de gastar el resto, no la cifra exacta.",
    mentorPrompt: "Ayúdame a distribuir mi ingreso mensual de forma simple, considerando mis gastos esenciales y mi meta de ahorro.",
  },
  {
    id: "invertir-basico",
    title: "¿Qué porcentaje debería invertir, y por dónde empiezo?",
    summary:
      "Dentro del 20% que separas para ahorro (ver \"¿Cómo distribuyo mi ingreso?\"), un orden razonable para empezar: primero completa un fondo de emergencia de 3 a 6 meses de tus gastos básicos, guardado en algo líquido y seguro (cuenta de ahorro o fondo de bajo riesgo) — mientras no lo tengas completo, casi todo ese 20% va ahí, no a inversión. Una vez completo, puedes empezar a mover una parte (por ejemplo la mitad de ese 20%, ajustable a tu tranquilidad) hacia inversión de bajo riesgo. Para empezar sin ser experto: los CDT (Certificados de Depósito a Término) y los fondos de inversión colectiva de bajo riesgo que ofrecen los bancos son puntos de entrada comunes en Colombia, con montos mínimos accesibles. Regla de oro: nunca inviertas en algo que no entiendes, y desconfía de cualquiera que te prometa rentabilidades \"garantizadas\" muy altas — eso casi siempre es una señal de fraude.",
    mentorPrompt: "¿Qué porcentaje de mi ingreso debería destinar a inversión, y por dónde empiezo de forma segura y sencilla, sin ser experto?",
  },
  {
    id: "gastos-variables",
    title: "Mis gastos varían mucho mes a mes, ¿cómo los controlo?",
    summary:
      "Los gastos variables (comida, transporte, salidas, imprevistos pequeños) son los más fáciles de perder de vista porque no llegan como una factura fija. Un método simple: durante un mes, anota (en el celular o en papel) cada gasto variable, aunque sea pequeño — al final del mes vas a ver patrones claros de en qué se te va la plata sin darte cuenta. Con eso, ponle un tope mensual a cada categoría (ej. \"máximo $X en comida fuera de casa\") y revísalo cada semana, no solo a fin de mes — así puedes ajustar a tiempo en vez de descubrir el problema cuando ya no hay nada que hacer.",
    mentorPrompt: "Mis gastos variables cambian mucho cada mes y se me van de las manos. ¿Cómo los controlo de forma simple?",
  },
  {
    id: "creditos-deudas",
    title: "Tengo créditos o deudas, ¿qué hago primero?",
    summary:
      "Si tienes varias deudas, dos estrategias reales para ordenarlas: pagar primero la de mayor tasa de interés (te ahorra más plata en total, aunque tome más tiempo ver resultados), o pagar primero la más pequeña (te da una victoria rápida que ayuda a mantener la motivación, aunque matemáticamente ahorres un poco menos). Cualquiera de las dos es mejor que no tener un orden. Evita sacar un crédito nuevo para pagar otro sin primero entender por qué se acumuló la deuda — si no, el problema se repite. Y antes de cualquier crédito nuevo (para lo que sea), compara la tasa efectiva anual entre entidades — no solo la cuota mensual, que puede parecer baja pero esconder un plazo mucho más largo y un costo total mucho mayor.",
    mentorPrompt: "Tengo varias deudas y créditos. ¿Cómo decido cuál pagar primero y cómo evito que se me acumulen más?",
  },
];
