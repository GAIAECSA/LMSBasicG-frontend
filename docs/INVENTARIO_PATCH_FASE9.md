# Inventario incremental — Fase 9

La base es el frontend limpio + patch Fase 7 + patch Fase 8.1 **ya aplicados**.
Solo sustituir los archivos que figuran en el ZIP, conservando todos los demás.

## Nuevos

- `lib/course-workspace/navigation.ts`: secciones MOOC/MDT y permisos declarativos.
- `lib/course-workspace/server.ts`: autorización SSR por tenant, rol y matrícula.
- `lib/course-workspace/editor.ts`: contrato/validación/FormData de edición.
- `app/campus/courses/[id]/layout.tsx`: gate y shell del curso.
- `app/campus/courses/[id]/[section]/page.tsx`: módulos blanco, configuración, placeholders y autorización.
- `tests/course-workspace-phase9.test.mjs`: regresiones de permisos y edición.
- `docs/AULA_FASE9.md`: contrato y límites de integración.
- `docs/INVENTARIO_PATCH_FASE9.md`: este archivo.

## Modificados (archivo completo)

- `app/campus/courses/[id]/page.tsx`: redirección a Módulos.
- `components/campus/campus-shell.tsx`: sidebar del curso condicionado y retorno.
- `components/campus/admin-course-detail.tsx`: sustitución del viejo resumen por editor funcional.
- `components/campus/visitor-my-courses.tsx`: botón para abrir curso con matrícula aceptada.
- `app/globals.css`: estilos responsive y branding para sidebar y editor.
- `tests/courses-phase6.test.mjs`: expectativas históricas ajustadas al nuevo flujo de configuración.
- `docs/DECISIONES_Y_CAMBIOS.md`: decisión arquitectónica.
- `docs/DISENO_Y_BRANDING.md`: regla visual para nuevas pantallas.

## Backend posterior (NO incluido)

- `GET /api/v1/courses/{course_id}/workspace` protegido, para TEACHER aceptado,
  con `course_id`, `name`, `course_type.code`; sin modificar el DTO público.
- `CourseUpdate.as_form`/servicio: mecanismo explícito para limpiar `discount_price`,
  `init_date`, `finish_date` (no simular eliminación con campos multipart vacíos).

No incluye migraciones, tablas, seeds, credenciales, ni cambios en FastAPI.
