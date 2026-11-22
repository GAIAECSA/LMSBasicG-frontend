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

## 2026-11-18 — Fase 3: shell del campus + gestión y consulta de políticas

**Qué se hizo, cómo y por qué:** la tabla pormenorizada y los endpoints verificados están en [`MODULO_POLITICAS_FASE3.md`](MODULO_POLITICAS_FASE3.md). Resumen de las decisiones duraderas:

1. Se reemplazó la pantalla «Llegaste» aislada por el mismo mensaje dentro de `CampusShell`, cuya barra lateral usa el nombre/logo de `businesses`, rol del backend y un tema de acentos del tenant con superficies neutras. Motivo: preparar el LMS modular sin duplicar menús ni exponer ATHENA.
2. Se agregó `/campus/policies`: administración exclusiva `ADMIN/PLATFORM` para políticas CLIENT y vista de consulta para los demás roles. Seguridad reforzada en SSR, BFF y FastAPI; no se concede privilegio por ocultar un botón.
3. Se agregaron formularios solo para crear tipo + subir primera versión o publicar una nueva versión HTML/PDF del mismo tipo. Se prohibieron acciones de edición, eliminación y cancelación en la interfaz; las versiones se mantienen auditables.
4. Se agruparon políticas por `code`. Una versión es vigente por `effective_at`, sin desactivar físicamente las históricas. Para estudiante, se listan obligatorias aceptadas e informativas de ATHENA y CLIENT, más su última aceptación histórica de tipos ya no visibles.
5. Se ampliaron los lectores BFF HTML/PDF para que FastAPI autorice las versiones actuales y aceptadas, además de las pendientes, con aislamiento por cookie/tenant y almacenamiento privado.
6. Se incorporaron pruebas de reglas de versión, esquema, permisos y enlaces seguros; se dejó constancia de los cambios recomendados de backend, no aplicados.

**Backend:** no modificado. **Docker y Nginx:** sin cambios. **Portada y Fase 2:** preservadas. Instalación e inventario en [`INVENTARIO_PATCH_FASE3.md`](INVENTARIO_PATCH_FASE3.md).

7. Se preparó el BFF de login y verificación de sesión para permitir únicamente las parejas `ADMIN/PLATFORM`, `VISITOR/PLATFORM`, `TEACHER/COURSE` y `STUDENT/COURSE` del seed una vez que FastAPI permita autenticar roles COURSE. El backend sigue bloqueándolos hoy; no se elevan permisos administrativos.

## 2026-11-19 — Fase 4: retirar confirmación de login y abrir el campus

| Qué se hizo | Cómo se hizo | Por qué |
|---|---|---|
| Se eliminó la pantalla provisional «Llegaste» / tarjeta de bienvenida de autenticación | Se sustituyó `CampusClient` por `CampusShell` + `CampusHome`, y se eliminaron los estilos `lms-arrived`. | El login ya fue probado y debe dar acceso al sistema, no a una pantalla de confirmación. |
| Se hizo operativo el Inicio | `CampusHome` muestra acceso a `/campus/policies` y `/`, usuario y `role.name`, `tenant.name`, y módulos entregados por `/business-lms-config/me/modules`. | Ofrecer acciones reales, sin métricas inventadas ni funcionalidades simuladas. |
| Se conservó el shell y las políticas de Fase 3 | El menú `CampusShell` y `/campus/policies` no cambian; ADMIN/PLATFORM mantiene Administración → Políticas y demás roles autorizados Información → Políticas. | No duplicar navegación ni alterar los permisos entre roles. |
| Se conservó la seguridad por servidor | `app/campus/page.tsx` conserva `resolveTenant()`, `authState()`, redirección a `/login` o `/policies`; el frontend no toma decisiones de autorización basadas solo en botones. | Evitar acceso sin sesión, sin tenant o con políticas obligatorias pendientes. |
| Se diseñó una interfaz legible con cualquier branding | `app/globals.css` usa superficies neutras y el acento CSS `--tenant-primary`; no se aplica el color corporativo sobre todo el fondo. | Permitir colores institucionales llamativos sin deteriorar contraste ni legibilidad. |
| Se documentaron las limitaciones reales | `INICIO_CAMPUS_FASE4.md`, `INVENTARIO_PATCH_FASE4.md`, `VERIFICACION.md`, `README.md` y tests. | Conservar contexto, alcance y puntos pendientes de backend para futuras fases. |

**Sin cambios en FastAPI, Nginx, Docker ni `.env`.** Continúa pendiente en FastAPI la renovación de JWT y habilitar el login COURSE (STUDENT/TEACHER) si ese bloqueo no se ha resuelto desde la Fase 3. Los módulos Gestión de usuarios, Cursos y contenidos, Matrículas y notas siguen en desarrollo; no se deben presentar como funcionales.


## Recuperación de acceso al Home — 19/11/2026

**Qué se hizo:** se consolidaron las Fases 2, 3 y 4 en un parche único para sustituir cualquier archivo provisional de la Fase 1, principalmente `components/auth/campus-client.tsx`. Incluye el Home real, el layout de navegación por rol, el módulo Políticas y la seguridad de sesión implementada en las fases anteriores.

**Cómo se hizo:** el paquete se construyó a partir del estado final ya integrado, en vez de encadenar parches parcialmente aplicados. Se agregó `VERIFICAR_Y_RECONSTRUIR.ps1` para detectar instalaciones en una carpeta equivocada y recompilar Docker sin caché; se agregó una prueba de regresión para el flujo con cero políticas pendientes.

**Por qué:** se observó el aviso «La portada y autenticación multi-tenant ya están listas», que existe en el frontend de Fase 1, pero no en la Fase 4. Esto apunta a código fuente o imagen de Docker sin actualizar, no a un requisito de crear políticas.

**Flujo conservado:** login por dominio → `GET /policies/pending` → con lista vacía, `/campus`; con lista no vacía, `/policies` hasta aceptar → `/campus`. No se requiere ningún documento publicado previamente. El backend no fue modificado.

**Limitaciones:** solo funcionan los módulos ya implementados (Inicio y Políticas); otros elementos del menú continúan deshabilitados. No se han ejecutado aquí pruebas de integración con Docker y el backend del usuario.


## 2026-11-19 — Fase 6.2: estándar de colores de identidad para todo el campus

Se estableció que el sidebar, los encabezados de formularios (incluido crear curso), acciones e iconos deben tomar su identidad del mismo `branding_config.colors` del tenant. Se eliminaron el azul fijo del sidebar y el degradado arbitrario de la creación de cursos. Se conserva la semántica independiente de estados (verde/ámbar/rojo) y superficies neutras para legibilidad. Se derivan colores de texto/hover/sidebar accesibles en `lib/tenant/branding.ts`, sin modificar FastAPI ni los contratos de la base de datos. **Reglas permanentes e inventario: [`DISENO_Y_BRANDING.md`](DISENO_Y_BRANDING.md), sección «Estandarización visual del campus».**


## 2026-11-20 — Fase 7, vista VISITOR: matrículas y catálogo

| Qué se hizo | Cómo | Motivo |
|---|---|---|
| Inicio exclusivo para ADMIN | `/campus` redirige VISITOR a `/campus/my-courses` tras `authState` y políticas | El visitante entra directamente a sus cursos; el dashboard administrativo permanece igual |
| Nuevo menú VISITOR | `CampusShell` muestra Mis cursos / Cursos / Certificados, mantiene Políticas | Evitar duplicar layout o exponer administración |
| Mis cursos con datos existentes | SSR consulta `/enrollments/me`, lo cruza con `courses/public/landing` del tenant, y requiere `status=ACEPTADO`, `is_published=true`; nunca comprueba `open_enrollment` para una matrícula existente | Respetar publicación y estado sin permitir a VISITOR listar `GET /courses` administrativo |
| Porcentaje honesto | SSR reúne `blocks-progress`, módulos, lecciones, bloques activos y bloques por defecto; calcula completados/activos para STUDENT. `null` si no se puede medir, TEACHER no aplica | No inventar porcentajes y aprovechar el progreso lazy ya existente; el agregado de FastAPI será la evolución escalable |
| Catálogo solo de lectura | Endpoint público existente, buscador, filtro de nivel, precio y portada; no hay CTA a matrículas | La autoinscripción se implementará después; no hay funciones falsas |
| Certificados informativo | Página independiente, protegida por sesión/rol/políticas y sin solicitudes a datos de certificados | El futuro módulo tendrá un lugar en el menú sin prometer su disponibilidad |
| Diseño y pruebas | Nuevas clases `visitor-*` consumen variables de branding, nueva suite `visitor-phase7.test.mjs` | Evitar hardcodes de color y regresiones de permisos/publicación |

### Contratos pendientes a decidir con backend

- Para escalar `/campus/my-courses`, exponer un endpoint de resumen por matrícula con porcentaje de bloques calculado **en FastAPI** (incluyendo bloques por defecto y elegibilidad de completitud, conteos no eliminados/activos). Actualizar la vista para no hacer consultas N+1 por módulos/lecciones/bloques. La métrica actual es un porcentaje de **bloques activos**, no de notas, asistencia o certificados.
- `/api/v1/enrollments/me` solo expone `CourseBasicResponse`; descripción e imagen se obtienen del catálogo público, por lo que cursos borrador se ocultan por diseño. No ampliar permisos de `/courses` administrativo a VISITOR.
- El DTO público no contiene `course_type.code` (MOOC/MDT): la nueva vista no lo finge. Una futura ficha pública podrá ampliar el DTO si se quiere distinguir modalidades.
- Mantener explícitamente separadas las solicitudes PENDIENTE de las matrículas ACEPTADO. No abrir autosolicitudes ni acceso al aula en esta fase.


## 2026-11-20 — Fase 8.1: consumir progreso agregado de FastAPI (VISITOR)

| Qué se hizo | Cómo | Por qué |
|---|---|---|
| Se eliminó el cálculo N+1 del frontend | `lib/visitor/data.ts` deja de descargar módulos, lecciones, bloques, tipos de bloques y BlockProgress por matrícula; usa `progress_percent` de `GET /api/v1/enrollments/me` | El backend Fase 8 computa el porcentaje mediante una única consulta SQL agregada, sin multiplicar peticiones HTTP |
| Se actualizó el contrato de matrícula | `lib/visitor/types.ts` conserva y valida `progress_percent`, `completed_blocks`, `total_active_blocks`, incluidos los nulos | Distinguir 0% real de ausencia de denominador y detectar un backend desactualizado o inconsistente |
| Se preservó la experiencia aprobada | `VisitorMyCourses`, la navegación VISITOR y el catálogo público no cambian; TEACHER muestra «No aplica», STUDENT usa el porcentaje del backend | Evitar rehacer la UI y conservar el filtrado por publicación + matrícula aceptada, sin filtrar por `open_enrollment` |
| Se actualizaron tests y documentación | `tests/visitor-phase7.test.mjs` y `docs/VISITOR_FASE7.md` | Que los contratos y las pruebas no sigan exigiendo peticiones eliminadas |

**Dependencia:** requiere backend Fase 8 ya aplicado; no hay cambios de esquema, endpoints nuevos ni BFF. No se amplía el DTO público con MOOC/MDT. Esta modificación es únicamente frontend.

## 2026-11-20 — Fase 9: workspace por curso y Configuraciones

- Entrada `/campus/courses/{id}` → Módulos; área en blanco a propósito hasta migrar su backend y UI.
- ADMIN entra sin enrollment; TEACHER exige enrollment `ACEPTADO`, rol de curso TEACHER y tenant coincidente; STUDENT conserva el menú general, sin opciones administrativas.
- Menú basado en `course_type.code`, no booleanos `is_mdt` o IDs. MDT añade Archivos MDT, Evidencia MDT y Reportes (solo ADMIN). Asistencia se unifica en una sola opción para MOOC y MDT.
- ADMIN/TEACHER comparten Módulos, Asistencia y Calificaciones. Matrículas, Certificados y Configuraciones son de ADMIN; Reportes de MDT solo ADMIN. Las secciones aún no migradas muestran un placeholder protegido.
- El editor real de curso está en Configuraciones, no en el catálogo. Usa PATCH multipart y conserva imagen en cualquier estado de publicación; método de calificación usa operación independiente de recálculo.
- Se retiraron los paneles «Certificados habilitados», «Próximos apartados» y la previsualización de transición MOOC/MDT. El tipo no se cambia a través de CourseUpdate porque la transición exige aprobación y reconciliación de datos en backend.
- Se detectaron dos pendientes backend: `GET /courses/{id}/workspace` autenticado y restringido a profesor matriculado para conocer el código MOOC/MDT sin cambiar el DTO público; y soporte explícito para limpiar campos opcionales (descuento/fechas) en `CourseUpdate`. Consultar `docs/AULA_FASE9.md` para contrato y alcances.


## 2026-11-20 — Fase 9.2: menú de aula con scroll y cambio explícito MOOC/MDT

- Problema: en pantallas de poca altura el sidebar de 9 se desbordaba y ocultaba rutas al pie; causa: `.lms-menu` no tenía desplazamiento propio. Decisión: `CampusShell` mantiene brand y cuenta, da `flex:1;min-height:0;overflow-y:auto` al menú, compacta únicamente la vista de curso y garantiza visibilidad del enlace activo por `scrollTop`. Se conservan los tokens del tenant.
- Se añadió `CourseTypeTransitionCard` a Configuraciones solo ADMIN, **fuera del PATCH general**. Usa BFF ya existente (`course-types`, `type-preview`, `type-change`), valida la modalidad disponible por `code`, muestra impacto real y requiere confirmación explícita. No se modifica FastAPI.
- Se bloquea el cambio si hay ajustes generales sin guardar y se mantiene el control de concurrencia/seguridad del backend. Las respuestas no confirmadas nunca se anuncian como éxito.
- El backend Fase 9.1 ya dispone del contexto docente; el DTO público sigue sin tipo. Mantener el soporte pendiente de limpieza explícita de descuentos y fechas sin mezclarlo con la conversión de modalidad.
- Archivos y verificación: consultar `docs/AULA_FASE9.md` y `docs/FASE9_2_SIDEBAR_CAMBIO_TIPO.md`.

## Fase 11 — Asistencias y Matrículas
- Asistencia opcional, manual y recurrente, para ambos tipos de curso MOOC/MDT. ADMIN y TEACHER ACEPTADO registran estado propio y de terceros.
- Matrículas exclusivas de ADMIN; rol por matrícula STUDENT/TEACHER, no rol PLATFORM del usuario.
- Plantilla Excel en español; importación local segura de texto. Hasta disponer de backend por lote, creación por fila no atómica con resultados detallados.
- No reproducir licencias o IDs fijos en UI; FastAPI sigue siendo autoridad de multi-tenancy y permisos.
- Se prioriza no alterar datos por coincidencias de identidad ambiguas, no forzar rol en usuarios aceptados, ni modificar calificación/certificados.
- Pendiente backend: endpoint recurrente transaccional, carga masiva de rol por fila, búsqueda paginada, DTO `role.code` de asistencia.
- Véase `docs/FASE11_ASISTENCIA_Y_MATRICULAS.md`.

## Fase 12.1 — Integración de operaciones atómicas en el frontend (20/11/2026)

- Matrícula existente en lote: `POST /enrollments/admin/bulk` (FastAPI); búsqueda ADMIN paginada `GET /users/search` con filtro VISITOR activo.
- Matrícula masiva: importa Excel español en navegador, envía JSON completo a `/enrollments/massive`; **prioriza cédula** dentro del tenant y no valida nombre/username/email para una cuenta encontrada. Solo el backend crea usuarios nuevos. No permite éxito parcial ni cambia roles previamente aceptados.
- Asistencia: días UI domingo=0 convertidos a backend lunes=0; previsualización y creación recurrente se envían completas al backend. Asistencias PENDIENTE se provisionan transaccionalmente con las sesiones.
- Se conservan las rutas, componentes y tokens de branding del tenant. No modificar el DTO público MOOC/MDT ni los permisos del workspace. Véase `docs/FASE12_1_FRONTEND_LOTES_ATOMICOS.md`.

## Fase 12.2 — Compatibilidad total de rutas de Asistencia (Frontend)

- Se corrigió el 404 de `GET /api/course-workspace/{id}/attendance` y las rutas
  individuales POST/GET/PUT/DELETE del BFF. El backend monta
  `/api/v1/course_attendance/course-attendance` y `/api/v1/attendance/attendance`,
  no `/api/v1/course-attendance` ni `/api/v1/attendance` sin segmento adicional.
- Todas las rutas se centralizaron en `lib/course-workspace/attendance-api.ts` y
  quedaron cubiertas por pruebas de regresión. Los endpoints recurrentes ya correctos
  no cambian su semántica ni su atomicidad.
- La identificación de los roles de asistencia es por matrícula del curso. ADMIN
  consulta matrículas del curso; TEACHER utiliza `/enrollments/me` y discrimina
  `role_id` docente conforme a los dos roles académicos vigentes. No se conceden
  permisos administrativos al profesor.
- Sin cambios de matriculación, autenticación, UI, estilos ni branding. Un 500 en
  `/api/auth/session` es independiente y exige revisar logs de Next.js.
- Ver `docs/FASE12_2_CORRECCION_ASISTENCIA.md`.

---

## 21/11/2026 — Fase 13: Recursos MDT en Next.js

**Decisión aprobada:** «Archivos MDT» y «Evidencia MDT» se unifican en **Recursos MDT**. Bloques `homework` de curso (`lesson_id IS NULL`) son requisitos documentales por STUDENT; bloques `pdf` de curso son evidencias institucionales no calificables. ADMIN del tenant y TEACHER aceptado del curso gestionan ambos grupos. No se crean LessonBlocks nuevos, no se califican estos documentos y el STUDENT puede seguir reemplazando sus propias entregas desde el backend de Homework.

**Implementación:** pantalla en `course-mdt-resources.tsx` con dos pestañas y subcomponentes separados, BFF privado `/api/mdt-resources/courses/{id}`, validadores TypeScript de DTO, búsqueda/paginación de FastAPI, subida/reemplazo por matrícula, PDF institucional, historial de autoría, CSS `.mdt-*` con tokens de branding. No se expone el JWT, paths internos ni URLs originales de archivos en el navegador.

**Dependencia:** requiere `20261121_0003` del parche backend de Recursos MDT. La carga propia de STUDENT se implementará visualmente cuando se migre el aula de estudiante; no se añadió a este panel de administración.

**Pruebas:** `tests/mdt-resources.test.mjs` y actualización de expectativas de Fase 9. Revisar la guía `docs/RECURSOS_MDT_FRONTEND.md` antes de cambios posteriores; es el contrato vigente de esta sección.

---

## 21/11/2026 — Recursos MDT: PDF único y visor en frontend

**Decisión del producto:** todos los recursos MDT (Homework raíz de STUDENT y bloques PDF institucionales) admiten únicamente un PDF de hasta 25 MiB; la consulta primaria es una previsualización privada con descarga opcional. Se mantienen subir, reemplazar, historial y permisos ADMIN/TEACHER, con edición propia STUDENT controlada por backend. La pantalla propia del STUDENT sigue pendiente de migración.

**Implementación:** `mdt-resources.ts` unifica la validación de cantidad/tamaño/formato solo para MDT y deriva URLs BFF `/preview` y `/download`. El BFF limita streaming multipart y convierte las respuestas PDF autorizadas en `inline` (visor) o `attachment` (descarga), sin exponer JWT ni URL del almacenamiento. `mdt-pdf-preview.tsx` incorpora modal accesible con iframe, descarga y fallback. `mdt-student-documents.tsx` y `mdt-institutional-pdfs.tsx` mantienen la misma gestión y muestran los archivos anteriores incompatibles como «Requiere actualización», sin eliminarlos automáticamente. CSS sigue `DISENO_Y_BRANDING.md`.

**Dependencia:** el backend requiere la actualización `Athena_Backend_Recursos_MDT_PDF_Unico_Visor_PATCH_20261121.zip` y Alembic `20261121_0003` ya existente, sin migraciones nuevas. No se modifica Homework académico de lecciones. Ver `docs/RECURSOS_MDT_FRONTEND.md`.
