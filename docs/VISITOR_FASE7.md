# Fase 7 — VISITOR: Mis cursos, Cursos y Certificados

**Fecha:** 20/11/2026. Base: `LMSBasicG-frontend-real-SAAS.zip` + cotejo con `Athena-Back-LMS-real-SAAS (1).zip`.

## Reglas de producto

1. VISITOR (`user.role.code=VISITOR`, `scope=PLATFORM`) **no ve Inicio**. Login → `GET /campus` → redirección SSR a `/campus/my-courses`, después de validar todas las políticas pendientes. ADMIN conserva `/campus` y CRUD.
2. «Mis cursos» muestra **exclusivamente** matrículas `ACEPTADO` que pertenecen al usuario y cuyo curso esté **publicado**; por seguridad, se exige que el curso exista en el listado público del tenant resuelto por Host. `open_enrollment=false` **no excluye** cursos aceptados. Matrículas `PENDIENTE` se cuentan aparte, pero no habilitan el curso. Rechazadas/canceladas se excluyen de los cursos activos.
3. Roles **académicos** leídos de `EnrollmentResponse.role.code` (`STUDENT` / `TEACHER`); NO de `users.role` de plataforma. TEACHER no registra BlockProgress, se indica «No aplica».
4. Porcentaje STUDENT = `100 * (LessonBlocks activos completados / LessonBlocks activos totales)` redondeado por FastAPI desde la fase 8. El frontend recibe `progress_percent` en `/enrollments/me`, no consulta módulos, lecciones ni bloques. Incluye bloques directos de curso y bloques de lecciones, con su estructura válida y no eliminada. Si no hay bloques activos, el porcentaje es `null`; la vista presenta «Progreso aún no disponible», **no 0% artificial**. No equivale a nota, aprobación, asistencia ni certificado.
5. «Cursos» es un **catálogo informativo**, con solo cursos publicados del tenant. No se filtra por `open_enrollment`, no se solicita matrícula; no hay aula habilitada ni acciones de compra.
6. «Certificados» permanece en navegación, con página de presentación sin operaciones. «Información/Políticas» continúa funcionando y el HTTP 428 se trata con el flujo existente.

## Data flow y archivos

| Función | Archivo principal | Backend |
|---|---|---|
| Login → ruta visitante | `app/campus/page.tsx` | `/auth/login`, `/policies/pending`, `/users/me` (existentes) |
| Navegación | `components/campus/campus-shell.tsx` | Estado revalidado SSR |
| Mis cursos | `app/campus/my-courses/page.tsx` + `components/campus/visitor-my-courses.tsx` | `/enrollments/me` (incluye `progress_percent`, `completed_blocks`, `total_active_blocks`) y `/courses/public/landing` |
| Validación y cruce | `lib/visitor/types.ts`, `lib/visitor/data.ts` | Parser del progreso entregado por FastAPI, JWT en cookie HttpOnly, exclusivamente SSR (`apiFetch`); no BFF adicional |
| Catálogo | `app/campus/catalog/page.tsx` + `components/campus/visitor-catalog.tsx` | `/courses/public/landing?domain=...` |
| Certificados | `app/campus/certificates/page.tsx` + `components/campus/visitor-certificates.tsx` | Ninguno todavía |
| Visual | `app/globals.css`, `docs/DISENO_Y_BRANDING.md` | Tokens de branding por hostname |

## Seguridad

- Ningún `GET /api/v1/courses` administrativo, ni acceso a cursos borrador.
- Nunca enviar `Authorization` al navegador. `lib/visitor/data.ts` ejecuta las consultas en Next SSR con la cookie host-only HttpOnly **después** de `authState(tenant)`.
- El backend continúa siendo la autoridad de roles, matrículas, políticas y tenant. La intersección de catálogo es defensa adicional de visibilidad, no reemplaza los permisos de FastAPI.
- Las imágenes usan `CourseCover` existente y `/api/academic/courses/[id]/image` con validación del tenant y carpeta restringida.
- No agregar compras, autoinscripción, certificado ni rutas a aula hasta su migración segura.

## Evolución aplicada: backend Fase 8 + actualización frontend

El backend ya devuelve el resumen agregado en **`GET /api/v1/enrollments/me`**. Los campos son `progress_percent: int | null`, `completed_blocks: int | null` y `total_active_blocks: int | null`. La fase 8 del backend calcula los bloques activos directamente del curso o asociados a lecciones con módulo/lección no eliminados, y los cruza con `BlockProgress.is_completed=true`, sin crear filas y en una consulta agregada para todas las matrículas elegibles. Se cuentan todos los LessonBlocks activos sin distinción de tipo de actividad ni peso en calificación.

**Frontend actualizado:** `lib/visitor/types.ts` valida y conserva estos campos (0 real, porcentaje entero, 100 y `null`), y `lib/visitor/data.ts` los utiliza directamente. Solo mantiene una consulta al catálogo público del tenant y una a las matrículas. Ya no llama a `/blocks-progress`, `/modules`, `/lessons`, `/lesson-blocks` ni `/lesson-block-types` para dibujar Mis cursos. TEACHER sigue mostrando «No aplica». Un curso sin bloques activos muestra «Progreso aún no disponible», no 0%. La regla del catálogo sigue incluyendo cursos publicados con `open_enrollment=false`.

**Contrato requerido:** este frontend necesita el backend con Fase 8 aplicada; respuestas de la versión anterior sin esos tres campos se consideran no disponibles, nunca se interpretan como progreso 0%. No se cambiaron el DTO público de MOOC/MDT, las vistas ni el branding.

**Opcional:** enriquecer `CoursePublicResponse` con `course_type.code` y, para matrícula, con descripción/imagen publicables, manteniendo el filtro `is_published` y los permisos; con el contrato actual la vista sí puede mostrar las imágenes gracias al cruce con el catálogo público.

## Verificación local y manual

- `npm test`: suite de regresión y pruebas nuevas (55/55 en la elaboración).
- `npm run typecheck`, `npm run lint`, `npm run build`: ejecutar tras instalar dependencias en el entorno del usuario. El entorno de elaboración no tiene `node_modules`.
- ADMIN no cambia: inicio, usuarios, categorías, subcategorías, cursos y políticas.
- VISITOR login: verificar URL final `/campus/my-courses`, sin Inicio visible y con estado de políticas normal.
- Matrícula ACEPTADO + curso publicado + `open_enrollment=false`: debe mostrarse. Borrador: no. PENDIENTE: solo contador. RECHAZADO/CANCELADO: no se muestran como cursos activos. Roles de cursos múltiples STUDENT/TEACHER correctos.
- Student: probar 0%, porcentaje parcial, 100%, curso sin bloques y respuesta de matrículas sin los nuevos campos. Teacher: «No aplica».
- Catálogo: todos publicados, incluyendo matrícula cerrada; buscador y filtros; imágenes con o sin portada; ningún botón de autoinscripción.
- Certificados: página informativa, sin descargas ni datos privados.
- Repetir en dos tenants con imágenes, nombre y colores diferentes. Verificar desktop y móvil.
