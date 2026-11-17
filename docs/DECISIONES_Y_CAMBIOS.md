# Bitácora de arquitectura — Frontend multi-tenant (fase 1, diseño original restaurado)

**Regla del proyecto:** registrar aquí todo cambio relevante indicando **qué, cómo y por qué**. Mantener comentarios técnicos en puntos de seguridad, tenancy, cache y despliegue. No documentar cada línea trivial.

## 2026-11-16 — Creación de base nueva

| Qué se hizo | Cómo se hizo | Por qué se hizo |
|---|---|---|
| Se creó un Next.js limpio | Se conservaron Next, React, iconos, TypeScript/ESLint. En la **revisión de restauración** también se incluyeron Tailwind v4 y su plugin PostCSS, necesarios para compilar el diseño original. Se descartaron carpetas legacy, archivos de experimentos, assets ATHENA, IP hardcodeadas y módulos aún no migrados. | Evitar arrastrar contratos incompatibles con el backend refactorizado sin perder el diseño validado. |
| Se implementó resolución real por dominio | `lib/tenant/resolve.ts` obtiene el `Host` original del proxy en el servidor y llama a `/api/v1/tenant/resolve`. Verifica `matched_domain`, `matched_domain_type=TENANT` y `tenant_domain`, no habilita dominio predeterminado y usa `cache: no-store`. | Un despliegue para múltiples dominios, sin riesgo de mostrar la marca equivocada por caché global. |
| Se definió esquema de branding | `lib/tenant/branding.ts` interpreta `branding_config.colors` y `content.hero`, valida HEX, deriva variantes de un color primario opcional y limita la longitud de texto. Inyecta variables CSS desde `app/layout.tsx` en cada petición. | Permitir colores/texto por academia sin recompilar Tailwind ni añadir HTML arbitrario. |
| Se actualizó la portada | `app/page.tsx` carga tenant + cursos por `tenant_domain`; **la revisión posterior reemplaza el diseño reinventado con la estructura original** en `components/public/home-client.tsx`. | La portada es el LMS público y debe conservar su apariencia existente, no una landing ni un rediseño. |
| Se retiró «Sobre ATHENA» | No se trasladó la página institucional, enlaces promocionales, imagen/logotipo de ATHENA ni las cifras fijas de alumnos. | Evitar presentar la marca del proveedor como identidad de una academia. |
| Se corrigió la integración de cursos | Se consulta `/api/v1/courses/public/landing?domain=...`, con DTO público real y sin filtro cliente de campos inexistentes. | El backend refactorizado cambió endpoints y formato de la respuesta. |
| Se implementó autenticación mínima | `/api/auth/login`, `/api/auth/session`, `/api/auth/logout` actúan como BFF y emiten cookies host-only HttpOnly. `/campus` es una pantalla sencilla de sesión. | Probar el acceso sin depender de `localStorage` ni exponer el JWT al navegador; los módulos internos se migrarán después. |
| Se preparó Docker reproducible | `Dockerfile` multi-stage standalone, `compose.yaml`, proxy Nginx compartido, `.env.example`, healthcheck y ejemplo de TLS externo. | Hacer un único despliegue con múltiples dominios, sin otro contenedor por academia. |
| Se documentó el contrato y próximos pasos | `README.md`, `docs/CONTRATO_BACKEND.md`, `docs/DESPLIEGUE.md`, bitácora y comentarios de código. | Evitar perder las razones arquitectónicas durante la siguiente refactorización. |

## Contrato inicial de `branding_config`

```json
{
  "version": 1,
  "colors": {
    "primary": "#1D4ED8",
    "primary_hover": "#1E40AF",
    "primary_soft": "#DBEAFE",
    "background": "#F7FAFF",
    "surface": "#FFFFFF",
    "text": "#0F172A"
  },
  "content": {
    "hero": {
      "eyebrow": "SISTEMA VIRTUAL DE APRENDIZAJE",
      "title": "Aprende con Academia Ejemplo",
      "description": "Explora los cursos disponibles y continúa tu formación profesional.",
      "cta_text": "Explorar cursos"
    }
  }
}
```

Los campos `businesses.name` y `businesses.logo_url` siguen siendo fuente única. Si `branding_config` es `{}`, se usan colores y frases genéricas, **nunca la marca ATHENA**.

## Límite explícito de esta fase

Esta entrega cubre **portada pública, catálogo, identificación del tenant, marca, autenticación básica y despliegue**. No declara migrados los módulos de estudiantes, docentes y administradores. El backend fue consultado para conocer contratos, **sin tocar sus archivos**.

## Verificación y límites de entrega

- Pruebas de branding y host: 4 aprobadas con Node 22, comando `npm test`.
- Inspección de sintaxis de 22 archivos TS/TSX: aprobada.
- Lockfile regenerado en modo offline para remover paquetes y referencias viejos.
- Pendiente compilación real y pruebas Docker/HTTPS contra API activa; el entorno no tuvo acceso a registry.npmjs.org ni ejecutables Docker/Nginx. Se deja constancia en `docs/VERIFICACION.md`.

## 2026-11-16 — Restauración explícita de la portada original (entrega corregida)

La entrega previa cambió la estética pese a que el usuario quería solo refactorizar la arquitectura. Esta revisión **recupera el JSX visual desde el ZIP original**. El backend sigue intacto.

| Qué se hizo | Cómo se hizo | Por qué se hizo |
|---|---|---|
| Se restauró la portada original | Se recuperaron de `LMSBasicG-frontend-mdtbranch/components/courses/public-courses-view.tsx` la jerarquía JSX, encabezado sticky, dos columnas, curso destacado, tres tarjetas, grilla de cursos, iconografía SVG original y breakpoints CSS. Están en `components/public/home-client.tsx`. | Conservar la apariencia aprobada en lugar de inventar otra interfaz. |
| Se conectó el diseño original al tenant | Se sustituyeron `HEADER_LOGO` y «ATHENA» por `tenant.logoUrl`/`tenant.name`, el hero por `tenant.hero`, y las peticiones del navegador por `courses` cargados SSR en `app/page.tsx`. | Un mismo diseño para todos los dominios, sin datos hardcodeados, sin exponer IP del backend. |
| Se conservaron colores con branding por academia | Se reintrodujo Tailwind v4 (`postcss.config.mjs`, `package.json`, `package-lock.json`). `app/globals.css` declara `@theme inline` para conectar las clases `blue-*` originales a `--tenant-primary`, `--tenant-primary-hover` y `--tenant-primary-soft` inyectados por SSR. Sombras y decoraciones siguen la marca. | El diseño conserva sus clases, tamaños y radios, pero cada academia tiene su propia paleta sin una compilación independiente. |
| Se eliminó contenido no pertinente | Se retiró `/athena` de navegación, se reemplazó la cifra ficticia de 2.500 estudiantes con el total real de cursos de la API y se reformularon las promesas absolutas de modalidad. El botón «Crear cuenta» pasó a «Acceder al campus» porque el backend no tiene registro público. | Evitar publicidad del proveedor, promesas no verificadas y un botón engañoso. |
| Se conservaron acciones funcionales | El carrusel y los filtros siguen funcionando en cliente. Se retiró la acción falsa de «guardar curso»: el corazón queda decorativo hasta que exista un endpoint de favoritos. | No presentar una función inexistente como operativa. |
| Se dejó un placeholder local genérico | `public/course-placeholder.svg`, sin logotipo del SaaS, se usa cuando faltan fotos de cursos. El logo vacío se reemplaza por un icono de academia neutral. | Evitar dependencias de imágenes externas y marcas cruzadas. |
| Se mantuvo Docker/Nginx existente | No se modificaron la resolución SSR, BFF de autenticación, Compose ni el backend. Se verificó sintaxis de Nginx con los upstreams reemplazados por direcciones locales durante la comprobación. | Cambiar solo la capa de presentación y conservar el aislamiento y el despliegue. |
| Se añadieron pruebas de regresión del diseño | `tests/diseno-original.test.mjs` verifica los bloques estructurales originales, referencias tenant, ausencia de publicidad fija y correspondencia `package.json`/lockfile. | Evitar repetir un rediseño involuntario en futuras refactorizaciones. |
| Se actualizó documentación de aceptación | `README.md`, `docs/DISENO_Y_BRANDING.md` y `docs/VERIFICACION.md`. | Mantener el contexto del porqué de cada decisión. |

**Límite:** la verificación de estructura no es una prueba visual pixel-perfect en navegador. `npm ci` / `next build` y Docker completo siguen pendientes de ejecutarse en un entorno con dependencias descargables y backend en funcionamiento.


## 2026-11-16 — Fase 2: login, verificación de sesión, configuración y políticas

**Backend:** inspeccionado en modo lectura; ninguna modificación. Se entrega un parche incremental que no altera el diseño de la portada, Docker ni Nginx.

| Qué se hizo | Cómo se hizo | Por qué se hizo |
|---|---|---|
| Se reforzó el login | `app/api/auth/login/route.ts` usa el tenant resuelto por hostname, valida usuario y rol del DTO FastAPI y consulta `policies/pending` antes de emitir cookie HttpOnly host-only. `components/auth/login-form.tsx` redirige según pendientes. | Evitar que el usuario o un atacante elijan el business por el formulario; prevenir acceso al campus sin comprobar cumplimiento. |
| Se verificó el ciclo de sesión | `lib/auth/server.ts`, `lib/auth/backend.ts`, `lib/auth/types.ts`, `/api/auth/session` y `SessionMonitor` validan la sesión con FastAPI, el tenant, expiración, el rol y políticas al navegar y durante uso. | El JWT se revoca en BD; un JWT simplemente decodificado no equivale a autorización. |
| Se cargaron rol y módulos para futuro dashboard | Tras completar las políticas, `authState` consulta `/users/me` y `/business-lms-config/me/modules`, valida `business_id`, y conserva el contrato tipado con `role.code`, `role.scope` y `config`. | Cumplir los gates de backend y preparar futura home por rol sin IDs mágicos ni reinventar capacidades. |
| Se incorporó wizard obligatorio de políticas | `/policies`, `PolicyWizard` y BFF `/api/policies/*` leen HTML/PDF protegidos, aceptan una versión a la vez, vuelven a consultar pendientes y cierran sesión al rechazar. HTML aislado en iframe sandbox/CSP; PDFs proxificados sin exponer tokens. | No saltar el 428, respetar versiones obligatorias y evitar mostrar todas las políticas a la vez. |
| Se reemplazó el campus placeholder | `/campus` resuelve sesión SSR y muestra únicamente una pantalla blanca con el texto `Llegaste` y botón de cierre. | El usuario pidió no implementar aún paneles por rol. |
| Se incluyó aviso sobre cookies | `CookieNotice` solo en `/`, registra preferencia del aviso en localStorage y explica la cookie imprescindible de sesión; CSS añadido, sin modificar el diseño original debajo. | Transparencia sobre cookies sin construir un CMP ficticio ni habilitar tracking. |
| Se registraron límites del backend | `docs/AUTENTICACION_Y_POLITICAS.md` y contrato incluyen la ausencia de refresh y restricción `scope=PLATFORM` que impide login para TEACHER/STUDENT COURSE. | Evitar aparentar funciones que FastAPI no proporciona y señalar cambios posteriores con su justificación. |
| Se añadieron pruebas | `tests/auth-phase2.test.mjs` valida formas de DTO y presencia de gates/CSRF y mantiene tests de branding/diseño; ver `docs/VERIFICACION.md`. | Prevenir regresiones mientras continúa la refactorización. |

**Renovación:** pendiente de endpoint real de backend con refresh token rotativo. `SessionMonitor` **NO** prolonga la sesión, únicamente detecta expiración/revocación y políticas nuevas.
