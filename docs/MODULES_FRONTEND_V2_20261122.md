# Athena LMS — Modules: integración Frontend Real SaaS (22/11/2026)

## Identidad del parche

Este documento prevalece para el módulo **Modules** sobre guías de fases antiguas. Se integra con el **backend refactorizado más `ATHENA_BACKEND_MODULES_PATCH_2026-11-22.zip`**; no es compatible por sí solo con el backend original anterior a ese parche. No sobrescribe ni reescribe los módulos MDT (documentos, asistencia, matrícula), certificados, políticas, roles u otros campus.

Los únicos cambios en el frontend anterior se limitan a activar la ruta Modules. El resto de archivos son nuevos. Los archivos íntegros viven en `components/campus/course-module*.tsx`, `components/campus/course-modules.module.css`, `lib/course-modules/*`, `app/api/course-modules/[id]/[...resource]/route.ts`, `tests/course-modules-v2.test.mjs`.

## Requisitos e instalación

1. Respalda repositorio y base de datos. Detén las actualizaciones simultáneas durante la instalación.
2. Aplica primero el **parche Modules de backend** y ejecuta su migración Alembic `20261122_0005` mediante `alembic upgrade head` sobre PostgreSQL de la instalación. Verifica `/openapi.json`.
3. Aplica además el **hotfix pequeño de compatibilidad de backend** (`ATHENA_BACKEND_MODULES_COMPAT_2026-11-22.zip`), que corrige el esquema de respuesta del catálogo de LessonBlockType y la descarga protegida de instrucciones Homework ZIP. No cambia tablas ni añade migración.
4. Copia los archivos completos de `ATHENA_FRONTEND_MODULES_PATCH_2026-11-22.zip` sobre la **raíz del repositorio frontend** respetando rutas. No sustituir carpetas enteras: solo copiar archivos incluidos.
5. Conserva las variables de entorno, Nginx, DNS y la configuración de tenant/branding. No añadir `NEXT_PUBLIC_` para el JWT. El BFF usa HttpOnly + la configuración de backend ya existente.
6. Con Node/npm instalados y dependencias disponibles, ejecutar `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` y `docker compose up -d --build` cuando corresponda.
7. Probar ADMIN y TEACHER con matrícula ACEPTADO sobre cursos MOOC y MDT, y otro tenant sin acceso. Confirmar que el curso no se reordena a medias, que Quiz/Encuesta no duplican respuestas y que se puede recuperar un Quiz asistido interrumpido.

## UI y dominio

- `app/campus/courses/[id]/[section]/page.tsx`: `section=modules` renderiza `CourseModules` con `courseId`, `courseName`, `role` obtenidos desde el workspace autorizado.
- Acordeones: módulos → lecciones → LessonBlocks; manual, sin autogeneración. El recurso se llama `Configurar` (antes `Entrar`), ofrece Editar, Archivar y, cuando corresponde, Revisar. El TEACHER dispone también de `Responder` la encuesta propia.
- HTML visual/HTML con estilos inline sanitizados; imágenes privadas y PDF de un archivo; video exclusivamente YouTube; Homework admite adjunto PDF/ZIP/imagen en instrucciones; Quiz con tipos SINGLE/MULTIPLE/TRUE_FALSE y GIFT; Survey con Likert 5, texto, público BOTH/STUDENT/TEACHER e importación CSV; Foro con instrucciones y conversación.
- Drag & drop entre padres del mismo curso y acciones alternativas de subir/bajar. El reordenamiento se confirma con **una única operación backend**, preservando el árbol ante fallos de guardado.
- Plan de calificación separado: draft parcial y activación al 100% WEIGHTED, promedio automático AVERAGE; pendientes como cero, estado pendiente preservado. La autoridad del cálculo reside en FastAPI.
- Revisar: matrículas reales, notas, intentos, entregas, publicaciones, resultados, registro asistido auditado con motivo y origen de evidencia, correcciones de notas. Transcripción de encuestas exige confirmación explícita de respuestas reales, origen PAPER o VERBAL; no es anónima.
- Vista previa local **sin POST**: no crea progreso, intentos, notas, publicaciones ni respuestas; muestra fechas bloqueadas y solo carga datos autorizados al editor.
- Los ocho recursos están disponibles en **MOOC y MDT**. Solo se gestionan bloques vinculados a `lesson_id` de lecciones del curso. Los bloques raíz MDT permanecen exclusivamente en su módulo correspondiente.

## BFF, aislamiento y operaciones autorizadas

- `app/api/course-modules/[id]/[...resource]/route.ts` es un BFF de rutas permitidas (lista blanca `lib/course-modules/paths.ts`), **no un proxy genérico**.
- Usa `getCourseWorkspace` y cookie HttpOnly para comprobar tenant, sesión, políticas obligatorias y rol ADMIN/TEACHER; CSRF por Origin para escrituras; datos multipart limitados por bytes realmente leídos.
- Comprueba pertenencia local de módulos, lecciones y bloques al árbol antes de CRUD básico. FastAPI **siempre valida de nuevo** tenant, curso, rol y vínculos internos.
- Streaming de archivos privados por BFF: nunca usa rutas físicas o JWT visible; puede descargar imágenes, PDF y ZIP de instrucciones. El hotfix de backend es imprescindible para este último formato.
- `GET /api/v1/academic-modules/{id}/structure`, `PUT /structure/order`; `GET/PUT/POST` de `/grade-plan`; CRUD canónico de modules/lessons/lesson-blocks; quiz/survey/forum/homework y `academic-assisted`, según `docs/MODULES_BACKEND_V2_20261122.md` del backend.
- Los cambios de contenido y de recurso específico (ej. `lesson-blocks` y `survey`) son contratos diferentes; la UI informa si se pierde la respuesta. **No son una transacción única**: al fallar la segunda operación, revisar el estado y reintentar la configuración pendiente.

## Validación y límites de garantía

- En este entorno `npm test` aprobó **134 pruebas**: 127 preexistentes y 7 nuevas de Modules (dominio puro, seguridad de allowlist, orden y URLs). Las pruebas del backend con hotfix aprobaron **113 pruebas** después de aplicar la suite actual del parche de backend. Compilación Python correcta y esquema LessonBlockTypeResponse verificado para los ocho códigos.
- Los **12 archivos TypeScript/TSX** del parche pasaron la **transpilación sintáctica TypeScript**, sin errores sintácticos.
- **NO** se verificó `npm ci`, `npm run typecheck`, `npm run lint` ni `npm run build` porque faltan las dependencias Node en esta máquina y la instalación npm no obtuvo un paquete de la caché/red. Tampoco se ejecutó E2E Docker/Next.js/FastAPI/PostgreSQL real. No afirmar que producción esté certificada.
- Quedan para posteriores fases: aula del STUDENT (no incluida en este patch), edición concurrente con versión explícita `If-Match`, accesibilidad DnD táctil avanzada, y pruebas E2E completas con archivos/quiz/grados/certificados entre varios tenants.

## Lista de verificación manual recomendable

1. ADMIN MOOC y MDT crean 8 tipos de recursos con nombre y fecha, y el STUDENT no puede ejecutar actividades antes de `date_available`.
2. TEACHER mueve una lección y un bloque a otro padre del **mismo curso**; no se permite cruzar cursos. Otro tenant no accede.
3. Plan 40/60, añadir Quiz, guardar borrador de nuevo plan 30/40/30 y activar al sumar 100%; pendiente computa cero.
4. Quiz 15 preguntas, mostrar 10 aleatorias, AUTO/MANUAL, importar GIFT, corregir clave con intentos y verificar recálculo y permisos.
5. Homework instrucciones ZIP y descarga privada; varias entregas adjuntas; registrar/calificar entrega asistida sin suplantar JWT.
6. Survey BOTH: estudiante y docente responden una vez; otra encuesta STUDENT solo; respuestas asistidas PAPER/VERBAL identificadas y reflejadas en reporte.
7. Foro con hilo anidado, publicación asistida identificada y moderación sin eliminación física.
8. Vista previa sin escritura y sin progreso.
