# Athena · Aula STUDENT — Fase final frontend

## Archivos fuente y versiones

- Basado EXCLUSIVAMENTE en `LMSBasicG-frontend-real-SAAS.zip` suministrado en la sesión, con las rutas BFF Modules y Reportes MDT ya aplicadas.
- Requiere **Athena Backend con `ATHENA_BACKEND_AULA_STUDENT_PATCH_2026-11-23.zip` instalado** y migraciones previas al día.
- No se cambian modelos, base de datos, Dockerfile, navegación general del campus, roles ni branding global.

## Contratos utilizados

`GET /api/v1/student-courses/{id}/overview` — matrícula STUDENT aceptada, curso, módulos/lecciones/bloques, documentos raíz MDT, progreso.

`GET /api/v1/student-courses/{id}/grades` — notas propias, actividades formativas y calificables, promedio AVERAGE o WEIGHTED, cálculo oficial en servidor.

`GET /api/v1/student-courses/{id}/eligibility` — elegibilidad, requisitos y certificados propios.

BFF: `app/api/student-courses/[id]/[...resource]/route.ts` con allowlist por tipo, recurso y pertenencia; cookie HttpOnly; protección same-origin en POST/PUT/PATCH; entrega de PDF/archivos privados sin token en el cliente.

Otros contratos backend (sin nuevo endpoint): `/lesson-blocks/{id}`, `/media/lesson-blocks/{id}/file`, `/blocks-progress/progress/complete`, `/quiz/blocks/{id}/attempts`, `/quiz/attempts/{id}/submit`, `/homework-response/blocks/{id}/submission`, `/survey/surveys/{id}/submit`, `/forum-response/blocks/{id}/posts`, `/certificates/{id}/generate` y download/preview de certificados.

## UX autorizada

- Cursos STUDENT conservan sidebar normal de VISITOR. Entrada `/campus/courses/{id}` redirige a `/summary`; ADMIN/TEACHER siguen entrando por `/modules`.
- Cabecera: portada, matrícula, nombre, datos, **solo** «Continuar aprendiendo»; pestañas Resumen, Contenido, Calificaciones, Certificado (MDT si corresponde).
- Resumen: descripción, objetivos genéricos, requisitos, progreso y expediente; no tiene bloque «Próximas actividades».
- Contenido: acordeones Module → Lesson → LessonBlock, estados visuales, fecha bloqueada, contenido HTML en iframe sandbox sin scripts, archivo privado por BFF y video YouTube nocookie.
- Progreso solo-lectura al abrir Texto/Imagen/PDF/Video, pero Quiz/Tarea/Encuesta/Foro lo registran los servicios de backend al realizar la acción. Un progreso al 100 % **no** equivale a elegibilidad automática.
- Quiz: navegación libre por preguntas del intento real, respuestas locales hasta envío, sin banco ni claves correctas. Intentos reanudables, lista de calificaciones.
- Homework: texto/adjuntos, edición hasta calificación; documento raíz MDT separado, exactamente un PDF por bloque raíz, no cuenta para promedio.
- Encuesta: Likert 5 con caritas y preguntas abiertas/otras previamente existentes, envío único por matrícula.
- Foro: conversación anidada, respuesta y edición de propia publicación, sin falsificación de identidad; asistidas identificadas.
- Calificaciones: se listan actividades ponderables e informativas; la nota oficial viene del backend, pendientes cuentan cero; se muestran pesos WEIGHTED.
- Certificado: MOOC genera si es elegible, si ya existe recupera; MDT elige ministerial/institucional si ambos existen. Nunca desbloquear solo en frontend: el servidor protege la descarga.

## Diseño

Todos los colores de marca proceden de `businesses.branding_config` vía `--tenant-primary`, `--tenant-on-primary`, `--tenant-accent-ink`, etc. Los estados verde/ámbar/rojo son colores semánticos, no branding. Estilos solo en `components/campus/student-course.module.css`; no aumenta `globals.css`.

## Limitaciones y validación

- `npm test`: 148 pruebas aprobadas (incluidas 8 nuevas del aula). Tests fuente/contrato **no equivalen a E2E**.
- Sintaxis de archivos TS/TSX verificada con TypeScript; comprobación semántica focalizada usando declaraciones temporales de bibliotecas, sin errores propios. **No es typecheck integral**.
- `npm ci` no pudo resolver dependencias por `EAI_AGAIN`; no fue posible certificar `npm run typecheck`, `npm run lint`, `npm run build` ni Docker/PostgreSQL en el sandbox. Ejecutarlos en entorno con acceso npm.
- Un Quiz iniciado guarda progreso en backend; las respuestas no enviadas al salir de la página no persisten hasta la entrega (API de intentos no ofrece guardado parcial).
- Las descripciones de Objetivos/Requisitos en Resumen son textos generales: backend no expone campos propios de objetivos en `StudentCourseBrief`.
- Adjuntos del homework: máximo 10 archivos, 25 MiB por archivo y límite preventivo de 50 MiB total por petición desde el BFF.
- «Mis cursos» sigue utilizando el catálogo publicado para construir tarjetas, aunque la URL de un curso ya matriculado sí funciona si se despublica. Habilitar listados privados sin depender del catálogo exigiría ampliar el contrato de matrículas/listado.

## Aplicación y prueba manual

1. Aplicar ZIP en la raíz del frontend, sin modificar `package-lock.json`.
2. Confirmar `ATHENA_BACKEND_AULA_STUDENT_PATCH_2026-11-23.zip` aplicado al backend.
3. `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
4. Probar con estudiante A de tenant 1, estudiante B de tenant 2, TEACHER y ADMIN; MOOC/MDT con actividades disponibles y futuras.
5. Comprobar read progress, Quiz con intentos, Homework edit/calificado, encuesta única Likert, respuestas de foro, 4 PDFs MDT, cálculo AVERAGE/WEIGHTED, elegibilidad 7/10, certificados ausentes/emitidos/revocados y descargas sin token.
