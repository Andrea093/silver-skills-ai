# CLAUDE.md — memoria del proyecto para retomar el trabajo

Este archivo es para que una sesión de Claude Code (o tú, en otra máquina) recupere contexto rápido
sin tener que re-derivarlo del código. El README.md es la documentación "de cara al usuario"
(cómo correr el proyecto); este archivo es más "notas internas de por qué las cosas son como son".

## Arquitectura en una línea

`backend/` = Express + TypeScript + Prisma. `frontend/` = React + Vite + TypeScript + Tailwind.
En dev, el backend usa SQLite local; en producción, Postgres (Neon) — **son dos esquemas de Prisma
separados**, ver la gotcha #1 abajo, es la fuente de más de un dolor de cabeza en esta sesión.

## Gotchas importantes (léelas antes de tocar el schema o desplegar)

### 1. Hay DOS archivos de schema de Prisma — hay que tocar los dos

- `backend/prisma/schema.prisma` → SQLite, para desarrollo local. Los cambios se aplican con
  `npx prisma migrate dev --name algo` (genera un archivo de migración versionado en
  `backend/prisma/migrations/`).
- `backend/prisma/schema.production.prisma` → Postgres (Neon), para producción. **No usa
  migraciones versionadas** — se sincroniza con `db push` (compara el schema contra la base real y
  aplica la diferencia).

**Cada vez que cambies un modelo, edita AMBOS archivos** (mismo campo nuevo en los dos), corre
`prisma migrate dev` para el local, y **después de desplegar a Render, corre manualmente**:

```bash
cd backend
DATABASE_URL="<la cadena real de Neon>" npm run prisma:push:prod
```

La cadena de conexión real está en Render → servicio `silver-skills-backend` → pestaña
Environment → `DATABASE_URL` (o directo en el dashboard de Neon). **Nunca la commitees.** Si se te
olvida este paso después de agregar un campo nuevo, el backend desplegado va a tirar error 500 en
cualquier endpoint que toque ese campo, aunque el build haya salido bien (el build de Render solo
corre `prisma generate`, no `db push` — ver `backend/package.json`, script `build:prod`).

### 2. `prisma generate` falla con EPERM si tienes el backend corriendo

En Windows, si tienes `npm run dev` corriendo en otra terminal (tsx watch), regenerar el cliente de
Prisma (`prisma migrate dev`, `prisma generate`, `prisma db push`) falla con:

```
EPERM: operation not permitted, rename '...\query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

Solución: mata el proceso que tiene el puerto 4000 (`netstat -ano | grep :4000` → `taskkill //PID <pid> //F`
en Git Bash, o cierra la terminal), corre el comando de Prisma, y vuelve a levantar `npm run dev`.

### 3. `render.yaml` dice "Supabase" en un comentario — es mentira, es Neon

El comentario original (línea ~13-15 de `render.yaml`) dice que la base vive en Supabase por el
límite de 90 días del Postgres gratis de Render. En algún momento se migró a **Neon**
(`*.neon.tech`) y el comentario quedó desactualizado. No hay un servicio de base de datos definido
en `render.yaml` — `DATABASE_URL` se pega manualmente en el dashboard de Render (`sync: false`).

### 4. Probar endpoints con acentos/ñ por curl en Git Bash de Windows los corrompe

`curl -d '{"texto":"cómo estás"}'` en Git Bash sobre Windows a veces manda los acentos mal
codificados (ej. genera resultados distintos a los reales). Si vas a probar algo con texto en
español vía curl, usa un archivo (`curl --data-binary @archivo.json`) o un script de Node con
`fetch`, no `-d` inline con comillas simples.

## Fuente única del orden de módulos

`frontend/src/lib/modules.ts` exporta `MODULES` — lo usan `NavBar.tsx`, `ModuleStepper.tsx` (la
barra Anterior/Siguiente al final de cada página de módulo) y las tarjetas de `Dashboard.tsx`. Antes
había dos listas escritas a mano por separado y se desincronizaron (el NavBar tenía Cursos al final,
el stepper lo tenía tercero) — si agregas un módulo nuevo, agrégalo aquí, no directo en NavBar.

## Qué se hizo en esta sesión (commits `8791d86..3d1969e`)

Resumen por tema — el mensaje de cada commit tiene el detalle técnico completo (`git log`):

- **Persistencia de CV**: el CV analizado se guarda en el backend (`CvAnalysis`) pero varias
  páginas no lo releían — ahora Evaluación, Dashboard, Actualización y Transición sí llaman a
  `GET /cv/latest`. El botón "Generar mi CV" ahora genera y descarga directo (antes solo navegaba a
  otra página sin generar nada) — lógica compartida en `frontend/src/lib/generateCv.ts` +
  `frontend/src/components/GenerateCvButton.tsx`.
- **Detección de profesión** (`backend/src/data/professionProfiles.ts`): scoring ponderado con
  puntaje mínimo (antes una palabra genérica como "sistemas" bastaba para ganar sin competencia) +
  nuevo perfil de primer nivel "Ciencias Naturales e Investigación" (antes solo existía como
  especialidad escondida bajo Educación, por eso una bióloga podía salir como ingeniera).
- **Objetivo genérico usado como búsqueda literal** (`backend/src/data/goalIntent.ts`):
  `extractGoalTarget` ahora devuelve `null` cuando el objetivo no especifica un destino real
  ("cambiar de empleo"), en vez de usar esa frase tal cual como query de vacantes/cursos — esto
  causaba vacantes 100% genéricas y cero coincidencias en Cursos para cualquiera cuyo objetivo no
  nombrara una meta específica.
- **Recomendaciones de habilidades no personalizadas** (`backend/src/services/assessmentScoring.ts`):
  `DEMAND_BY_PROFESSION` — antes TODOS los usuarios veían las mismas 4 habilidades recomendadas
  ("Inteligencia Artificial", "Marketing Digital", etc.) sin importar su profesión real.
- **Búsqueda de cursos** (`backend/src/services/courseCatalog.ts`): alias/sinónimos con coincidencia
  por palabra completa (ojo: la primera versión de esto tenía un bug de falsos positivos con alias
  cortos como "ia" — matcheaba dentro de "Inteligencia" o "Especialización" por substring plano;
  quedó arreglado con `\b...\b`). Fallback a enlaces reales de búsqueda cuando no hay match curado.
- **Filtros de vacantes** (`backend/src/services/jobAggregator.ts`): filtro de ciudad ahora aplica
  de verdad, nivel "Intermedio" agregado, fallback quando los filtros dejarían 0 resultados. El
  filtro de país solo tiene cobertura completa si `ADZUNA_APP_KEY`/`JOOBLE_API_KEY` están
  configuradas — sin ellas, solo Colombia tiene cobertura garantizada (vía SPE, sin key).
- **Universidades/programas en Cursos**: campo `programType` nuevo en `Course` (migración aplicada),
  6 programas sembrados, recomendación conectada a si el objetivo es cambio de carrera o mejora de
  habilidades.
- **Pensión rediseñada** (`backend/src/services/pensionEstimate.ts`): se quitó el selector manual de
  "un escenario a la vez" — ahora se calculan las palancas reales a la vez (formalizarte —omitido
  si ya cotizas—, cambiar de régimen RPM/RAIS, aporte voluntario con monto real) y se recomienda la
  que más ayuda según los datos de esa persona.
- **Bienestar Financiero**: la recomendación de "prioriza deuda" antes no mencionaba el fondo de
  emergencia real (mismo texto sin importar el monto) — ahora siempre cita meses/monto reales.
- **Mentor**: pasó de página completa (`/mentor`) a botón flotante persistente
  (`frontend/src/components/MentorWidget.tsx` + `frontend/src/context/MentorContext.tsx`), montado
  fuera de `<Routes>` para no perder la conversación al navegar. Ícono: emoji 🧑‍💼, no el bot
  genérico de lucide-react.
- **Dashboard**: ya no duplica la lista de habilidades + gráfico de pastel de Evaluación — ahora
  muestra tarjetas de acceso rápido por módulo (reusa `MODULES` de `lib/modules.ts`).
- **Lectura de CV en PDF de dos columnas** (Canva y similares):
  `backend/src/services/pdfColumnAwareRender.ts` — reemplaza el `pagerender` por defecto de
  `pdf-parse`, que intercala línea por línea el texto de ambas columnas (rompe la detección de
  secciones en `cvParser.ts`). Detecta si existe un espacio (gutter) real entre columnas y, si lo
  hay, lee la columna izquierda completa y luego la derecha, en vez de alternar. No usa IA (no hay
  `ANTHROPIC_API_KEY` configurada en este proyecto) — es heurística geométrica pura, basada en
  posiciones x/y de cada palabra dentro del PDF. Cubierto por pruebas manuales con 4 layouts
  sintéticos (ver el commit `3d1969e` para el detalle de qué se probó).

## Limitaciones conocidas, sin resolver todavía

- **PDF escaneado / foto de la hoja de vida**: no hay OCR. `pdf-parse` solo extrae texto real; un
  PDF sin texto seleccionable (imagen) devuelve error "No se pudo extraer texto del archivo".
- **`.doc` legacy** (binario viejo, no `.docx`): `mammoth` está pensado para `.docx`; un `.doc` real
  puede no procesarse bien aunque la extensión lo deje pasar.
- **Filtro de país fuera de Colombia**: sin `ADZUNA_APP_KEY`/`JOOBLE_API_KEY`, casi no hay cobertura
  real para países que no sean Colombia (solo lo que Remotive/Arbeitnow —ambos de tecnología—
  encuentren). Ver README para cómo conseguir esas keys gratis.
- **Mentor / resumen de evaluación / reescritura de CV con IA**: todo funciona en modo heurístico de
  respaldo sin `ANTHROPIC_API_KEY` — sigue devolviendo datos reales (vacantes, cursos), pero sin el
  refinamiento de Claude.
