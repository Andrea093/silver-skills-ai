# Silver Skills AI

Plataforma real (frontend + backend) de empleabilidad y reskilling para adultos 50+ en LATAM,
basada en el prototipo de Figma "Silver Skills AI". Evalúa habilidades, muestra riesgo de
automatización vs. potencial de adaptación, recomienda cursos y rutas de aprendizaje reales, sugiere
vacantes reales, y ofrece un Mentor IA conversacional.

## Estructura

```
backend/    Express + TypeScript + Prisma (SQLite en dev)
frontend/   React + Vite + TypeScript + Tailwind + Recharts
```

## Requisitos

- Node.js 18+ (probado con Node 25)
- npm

No necesitas Docker ni instalar PostgreSQL: el backend usa SQLite por defecto (archivo local
`backend/prisma/dev.db`). Para producción, cambia el `provider` en `backend/prisma/schema.prisma`
a `"postgresql"` y actualiza `DATABASE_URL` — no hace falta tocar el resto del código.

## Puesta en marcha

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev          # http://localhost:4000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev           # http://localhost:5173
```

Abre `http://localhost:5173` y entra con el usuario demo precargado:

- **Correo:** maria.gonzalez@example.com
- **Contraseña:** demo1234

También puedes crear tu propia cuenta desde "Regístrate".

## Dónde asignar/modificar usuarios, credenciales y contraseñas

El seed crea una cuenta **administradora** fija:

```
admin@silverskills.ai / SilverSkills2026!
```

(o el valor que pongas en `ADMIN_DEFAULT_PASSWORD` en `.env`). A propósito, **cada `npx prisma db
seed` (incluido el build automático en cada redeploy de Render) restablece esa contraseña a este
valor conocido** — así nunca te quedas sin poder entrar como admin. Si ya la cambiaste desde
`/admin` y quieres que los redeploys dejen de tocarla, agrega `ADMIN_PASSWORD_LOCKED=true` en el
entorno.

Inicia sesión con esa cuenta y entra a **`/admin`** (aparece un link "🛠️ Admin" en la barra de
navegación solo para administradores). Desde ahí puedes, para cualquier usuario:

- Ver todas las cuentas registradas.
- **Restablecer su contraseña** (genera una temporal y te la muestra una sola vez para que se la
  compartas a esa persona).
- Activar/desactivar **Premium** (ver siguiente sección).
- Eliminar la cuenta.

No hay otra pantalla de gestión de usuarios — todo pasa por `/admin` con la cuenta administradora.

## Función Premium: generador de CV optimizado

En `/transicion`, después de analizar un CV, aparece "Generar CV Optimizado" (marcado ✨ Premium):
convierte el CV en un `.docx` descargable, en dos modos:

- **Optimizado para ATS**: reescribe/reordena el CV con palabras clave generales de la industria
  detectada.
- **Adaptado a una vacante específica**: el usuario elige una de las vacantes **reales** ya
  listadas (con su descripción real) y el CV se reescribe priorizando lo que esa vacante pide.

Es la función premium real del producto (`User.isPremium` en la base de datos, verificado en el
backend en `POST /api/cv/generate`) — pero en este prototipo **todas las cuentas nuevas nacen con
`isPremium: true`** para que cualquiera pueda probarla sin fricción. Desde `/admin` puedes quitarle
Premium a una cuenta para simular el comportamiento de un plan gratuito (la función responde 403).

Sin `ANTHROPIC_API_KEY` configurada, el CV se reescribe con una heurística simple (reordena
habilidades y resume el texto) en vez de una reescritura real por IA — sigue produciendo un
`.docx` real y válido, solo que menos elaborado.

## Accesibilidad (diseño pensado para 45+)

Tipografía base más grande de lo habitual (17px, en vez de los 16px por defecto del navegador),
alto contraste, botones con más área de toque, y un control **"A+"** en la barra de navegación que
alterna tres tamaños de texto (normal / grande / extra grande) recordado en el navegador de cada
persona.

## Variables de entorno (`backend/.env`)

| Variable | Requerida | Efecto |
|---|---|---|
| `DATABASE_URL` | Sí (ya viene lista para SQLite) | Conexión a la base de datos |
| `JWT_SECRET` | Sí (cambia el valor por defecto) | Firma de sesiones |
| `ANTHROPIC_API_KEY` | No | Activa el Mentor IA con Claude (tool-use real) y el análisis de CV con IA. Sin ella, ambos funcionan en modo de respaldo basado en reglas — pero **siempre** con vacantes/cursos reales. |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | No | Activa vacantes reales de Adzuna para LATAM (cuenta gratuita en https://developer.adzuna.com/). Sin ellas, las vacantes vienen de Remotive + Arbeitnow (sin key) + enlaces de búsqueda directa a LinkedIn/Indeed/Computrabajo/OCC. |

### Cómo obtener tu `ANTHROPIC_API_KEY`

1. Crea una cuenta en console.anthropic.com.
2. Ve a Settings → API Keys → Create Key.
3. Carga crédito en Settings → Billing (la API no tiene tier gratuito permanente).
4. Pega la key en `backend/.env`.

## Qué es real y qué es heurístico (transparencia)

- **Vacantes**: Remotive y Arbeitnow son APIs públicas reales sin key — los resultados y enlaces de
  "Ver oferta" llevan a la publicación real. Adzuna (opcional) suma vacantes reales de LATAM. Los
  botones de LinkedIn/Indeed/Computrabajo/OCC Mundial abren búsquedas reales prellenadas en esos
  portales (no existe API pública gratuita para ellos).
- **Cursos**: catálogo curado con cursos verificados como reales y activos (Coursera, edX,
  verificados por fetch al construir la app) y, para Udemy/LinkedIn Learning y temas fuera del
  catálogo, enlaces a páginas reales de búsqueda/categoría de cada plataforma en vez de inventar
  IDs de curso no verificables. Rating/duración de esas entradas de búsqueda son estimaciones
  representativas, no datos de un curso específico.
- **Riesgo de automatización / potencial de adaptación / índice de empleabilidad**: fórmulas
  heurísticas deterministas (no un modelo de ML entrenado) — ver `backend/src/services/assessmentScoring.ts`.
  Con `ANTHROPIC_API_KEY` configurada, el resumen textual de fortalezas se enriquece con Claude.
- **Sectores de crecimiento en LATAM**: dataset ilustrativo/direccional, no un feed de mercado en vivo.
- **Mentor IA**: con `ANTHROPIC_API_KEY`, es un agente real de Claude con tool-use (`search_jobs`,
  `search_courses`) que ejecuta las búsquedas reales de arriba. Sin la key, usa reglas simples por
  palabra clave pero sigue devolviendo vacantes/cursos reales con enlaces reales.

## Desplegar en Render (URL pública para que otras personas la prueben)

El repo incluye `render.yaml` (Blueprint) que crea 3 servicios: backend (Node), base de datos
(Postgres gratis) y frontend (sitio estático). Pasos que **debes hacer tú** (no puedo crear cuentas
de terceros en tu nombre):

1. Entra a [render.com](https://render.com) y crea una cuenta gratis (botón "Sign up with GitHub").
2. En el dashboard: **New +** → **Blueprint** → selecciona el repo `silver-skills-ai`.
3. Render detecta `render.yaml` y muestra los 3 servicios a crear. Antes de confirmar, en el
   servicio `silver-skills-backend` agrega estas variables de entorno opcionales (pestaña
   "Environment" del servicio, después de creado, si no aparece el campo antes):
   - `ANTHROPIC_API_KEY` — tu key (ver arriba cómo obtenerla). Sin ella, el Mentor IA y el
     generador de CV funcionan en modo asistido/heurístico.
   - `ADZUNA_APP_ID` y `ADZUNA_APP_KEY` — opcionales, para más vacantes reales de LATAM.
4. Click "Apply" / "Create". El primer build tarda unos minutos (instala dependencias, genera
   Prisma contra Postgres, siembra datos, compila).
5. Cuando termine, abre la URL del servicio `silver-skills-frontend`
   (algo como `https://silver-skills-frontend.onrender.com`) — esa es la URL pública para compartir.
6. Inicia sesión como admin con `admin@silverskills.ai` / `SilverSkills2026!` (o el valor que
   hayas puesto en `ADMIN_DEFAULT_PASSWORD`) y cámbiala desde `/admin` si quieres — ver la sección
   de arriba sobre `ADMIN_PASSWORD_LOCKED` si no quieres que los redeploys la reestablezcan.

**Limitaciones del plan gratuito de Render** (aceptables para un prototipo, no para producción real):
- El backend "se duerme" tras ~15 min sin tráfico; la primera visita tras eso tarda ~30-60s en
  responder mientras despierta.
- La base Postgres gratuita expira a los 30 días. Cuando eso pase, Render avisa por correo; hay que
  recrearla (New + → PostgreSQL) o pasar el plan a uno pago para que persista indefinidamente.
- Si al crear el Blueprint alguno de los dos nombres de servicio (`silver-skills-backend` /
  `silver-skills-frontend`) ya está tomado, Render le agrega un sufijo a la URL — en ese caso edita
  `render.yaml` (el `routes` del frontend y el `CLIENT_ORIGIN` del backend) para que apunten a las
  URLs reales asignadas, y vuelve a desplegar.

## Comandos útiles

```bash
# Backend
npx prisma studio       # explorar la base de datos con UI
npm run build && npm start   # build de producción

# Frontend
npm run build            # build de producción a frontend/dist
```
