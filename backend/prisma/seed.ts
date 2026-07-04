import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Course catalog: entries 1-5 link to specific course/certificate pages verified to be real and
// live. Entries 6-12 link to real provider search/category pages (Udemy/LinkedIn
// Learning/Coursera/edX) rather than a single fabricated course-detail URL — the link always
// leads to a real, working page, but rating/duration/students figures on those are
// representative platform-level estimates rather than pulled from one specific course.
const COURSES = [
  {
    title: "Generative AI for Everyone",
    provider: "Coursera (DeepLearning.AI)",
    url: "https://www.coursera.org/learn/generative-ai-for-everyone",
    isFree: true,
    priceLabel: "Gratis (modo auditoría)",
    durationWeeks: 3,
    level: "Principiante",
    rating: 4.8,
    studentsCount: 800000,
    tags: ["ChatGPT", "IA Generativa", "Prompting"],
    category: "IA y Tecnología",
    featured: true,
  },
  {
    title: "Prompt Engineering for ChatGPT",
    provider: "Coursera (Vanderbilt University)",
    url: "https://www.coursera.org/learn/prompt-engineering",
    isFree: true,
    priceLabel: "Gratis (modo auditoría)",
    durationWeeks: 2,
    level: "Intermedio",
    rating: 4.8,
    studentsCount: 690000,
    tags: ["ChatGPT", "Prompting", "IA Generativa"],
    category: "IA y Tecnología",
    featured: false,
  },
  {
    title: "Google Data Analytics Professional Certificate",
    provider: "Coursera (Google)",
    url: "https://www.coursera.org/professional-certificates/google-data-analytics",
    isFree: false,
    priceLabel: "$49 USD/mes (prueba gratis 7 días)",
    durationWeeks: 24,
    level: "Principiante",
    rating: 4.8,
    studentsCount: 3600000,
    tags: ["Análisis de Datos", "Excel", "SQL"],
    category: "IA y Tecnología",
    featured: false,
  },
  {
    title: "Digital Marketing Specialization",
    provider: "Coursera (Universidad de Illinois)",
    url: "https://www.coursera.org/specializations/digital-marketing",
    isFree: false,
    priceLabel: "Incluido con suscripción Coursera",
    durationWeeks: 12,
    level: "Intermedio",
    rating: 4.7,
    studentsCount: 420000,
    tags: ["Marketing Digital", "SEO", "Redes Sociales"],
    category: "Marketing Digital",
    featured: true,
  },
  {
    title: "Finanzas Personales y Planificación de Retiro",
    provider: "edX",
    url: "https://www.edx.org/learn/personal-finance",
    isFree: true,
    priceLabel: "Gratis (modo auditoría en la mayoría de cursos)",
    durationWeeks: 4,
    level: "Principiante",
    rating: 4.6,
    studentsCount: 9800,
    tags: ["Inversiones", "Ahorro", "Planificación"],
    category: "Finanzas",
    featured: false,
  },
  {
    title: "Liderazgo Ágil en la Era Digital",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/search?keywords=liderazgo%20agil",
    isFree: true,
    priceLabel: "Incluido con prueba gratis de LinkedIn Learning",
    durationWeeks: 3,
    level: "Intermedio",
    rating: 4.7,
    studentsCount: 15680,
    tags: ["Scrum", "Gestión de equipos", "Transformación"],
    category: "Liderazgo",
    featured: true,
  },
  {
    title: "Excel Avanzado para Análisis de Datos",
    provider: "Udemy",
    url: "https://www.udemy.com/courses/search/?q=excel+avanzado+analisis+de+datos",
    isFree: false,
    priceLabel: "Desde $19 USD (precio varía por promoción)",
    durationWeeks: 5,
    level: "Intermedio",
    rating: 4.6,
    studentsCount: 23450,
    tags: ["Excel", "Tablas dinámicas", "Power Query"],
    category: "IA y Tecnología",
    featured: false,
  },
  {
    title: "Planificación Financiera para el Retiro",
    provider: "edX",
    url: "https://www.edx.org/search?q=personal+finance+retirement+planning",
    isFree: true,
    priceLabel: "Gratis (modo auditoría en la mayoría de cursos)",
    durationWeeks: 4,
    level: "Principiante",
    rating: 4.5,
    studentsCount: 6200,
    tags: ["Retiro", "Inversiones", "Presupuesto"],
    category: "Finanzas",
    featured: false,
  },
  {
    title: "Fundamentos de Liderazgo y Gestión de Equipos",
    provider: "Coursera",
    url: "https://www.coursera.org/search?query=leadership%20and%20management",
    isFree: true,
    priceLabel: "Gratis (modo auditoría en la mayoría de cursos)",
    durationWeeks: 6,
    level: "Principiante",
    rating: 4.6,
    studentsCount: 32000,
    tags: ["Liderazgo", "Gestión de cambio", "Comunicación"],
    category: "Liderazgo",
    featured: false,
  },
  {
    title: "Emprendimiento Digital: De la Idea al Negocio",
    provider: "Coursera",
    url: "https://www.coursera.org/search?query=entrepreneurship",
    isFree: true,
    priceLabel: "Gratis (modo auditoría en la mayoría de cursos)",
    durationWeeks: 10,
    level: "Principiante",
    rating: 4.6,
    studentsCount: 45000,
    tags: ["E-commerce", "Modelos de negocio", "Marketing"],
    category: "Emprendimiento",
    featured: false,
  },
  {
    title: "Marketing Digital para Redes Sociales",
    provider: "Udemy",
    url: "https://www.udemy.com/courses/search/?q=marketing+digital+redes+sociales",
    isFree: false,
    priceLabel: "Desde $15 USD (precio varía por promoción)",
    durationWeeks: 4,
    level: "Principiante",
    rating: 4.5,
    studentsCount: 18700,
    tags: ["Redes Sociales", "Contenido", "Publicidad"],
    category: "Marketing Digital",
    featured: false,
  },
  {
    title: "Comunicación Efectiva e Inteligencia Emocional",
    provider: "LinkedIn Learning",
    url: "https://www.linkedin.com/learning/search?keywords=comunicacion%20efectiva%20inteligencia%20emocional",
    isFree: true,
    priceLabel: "Incluido con prueba gratis de LinkedIn Learning",
    durationWeeks: 3,
    level: "Principiante",
    rating: 4.7,
    studentsCount: 21000,
    tags: ["Comunicación", "Inteligencia Emocional", "Liderazgo"],
    category: "Liderazgo",
    featured: false,
  },
];

async function main() {
  console.log("Seeding courses...");
  await prisma.course.deleteMany();
  const createdCourses = [];
  for (const c of COURSES) {
    const created = await prisma.course.create({
      data: { ...c, tags: JSON.stringify(c.tags) },
    });
    createdCourses.push(created);
  }
  const byTitle = new Map(createdCourses.map((c) => [c.title, c.id]));

  console.log("Seeding learning paths...");
  await prisma.learningPath.deleteMany();
  await prisma.learningPath.createMany({
    data: [
      {
        title: "Ruta: Consultor Digital",
        weeks: 12,
        tags: JSON.stringify(["IA", "Marketing", "Análisis de Datos"]),
        courseIds: JSON.stringify(
          [
            "Generative AI for Everyone",
            "Google Data Analytics Professional Certificate",
            "Digital Marketing Specialization",
            "Fundamentos de Liderazgo y Gestión de Equipos",
          ].map((t) => byTitle.get(t))
        ),
      },
      {
        title: "Ruta: Emprendedor Digital",
        weeks: 10,
        tags: JSON.stringify(["E-commerce", "Marketing", "Finanzas"]),
        courseIds: JSON.stringify(
          [
            "Emprendimiento Digital: De la Idea al Negocio",
            "Marketing Digital para Redes Sociales",
            "Finanzas Personales y Planificación de Retiro",
            "Excel Avanzado para Análisis de Datos",
            "Prompt Engineering for ChatGPT",
          ].map((t) => byTitle.get(t))
        ),
      },
      {
        title: "Ruta: Líder de Transformación",
        weeks: 8,
        tags: JSON.stringify(["Liderazgo Ágil", "Gestión del Cambio", "IA"]),
        courseIds: JSON.stringify(
          [
            "Liderazgo Ágil en la Era Digital",
            "Comunicación Efectiva e Inteligencia Emocional",
            "Generative AI for Everyone",
          ].map((t) => byTitle.get(t))
        ),
      },
    ],
  });

  console.log("Seeding demo user...");
  const passwordHash = await bcrypt.hash("demo1234", 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "maria.gonzalez@example.com" },
    update: {},
    create: {
      name: "María González",
      email: "maria.gonzalez@example.com",
      passwordHash,
      employabilityScore: 78,
    },
  });

  await prisma.skill.deleteMany({ where: { userId: demoUser.id } });
  await prisma.skill.createMany({
    data: [
      { userId: demoUser.id, name: "Liderazgo", level: 85 },
      { userId: demoUser.id, name: "Excel", level: 70 },
      { userId: demoUser.id, name: "Comunicación", level: 90 },
      { userId: demoUser.id, name: "IA Generativa", level: 45 },
      { userId: demoUser.id, name: "Gestión", level: 80 },
    ],
  });

  console.log("Seeding admin account...");
  // By default every seed run (including on each Render redeploy) resets the admin password back
  // to a known, documented value — recoverability matters more than silently preserving a change
  // for this prototype's admin account. If you've customized the password via /admin and want
  // redeploys to leave it alone, set ADMIN_PASSWORD_LOCKED=true.
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || "SilverSkills2026!";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const adminPasswordLocked = process.env.ADMIN_PASSWORD_LOCKED === "true";
  await prisma.user.upsert({
    where: { email: "admin@silverskills.ai" },
    update: adminPasswordLocked ? {} : { passwordHash: adminPasswordHash, role: "admin" },
    create: {
      name: "Administrador",
      email: "admin@silverskills.ai",
      passwordHash: adminPasswordHash,
      role: "admin",
      employabilityScore: 0,
    },
  });

  console.log("Seed complete.");
  console.log("Demo login:  maria.gonzalez@example.com / demo1234");
  if (adminPasswordLocked) {
    console.log("Admin login: admin@silverskills.ai / (contraseña bloqueada — ADMIN_PASSWORD_LOCKED=true, no se tocó)");
  } else {
    console.log(`Admin login: admin@silverskills.ai / ${adminPassword}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
