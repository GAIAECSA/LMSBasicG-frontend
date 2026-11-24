# Parche incremental de frontend — Recursos MDT PDF único y visor

**Base:** frontend nuevo + parche Recursos MDT Fase 13 ya aplicado; este ZIP **no** reemplaza el frontend completo.

## Archivos nuevos
- `components/campus/mdt-pdf-preview.tsx`
- `tests/mdt-resources-pdf.test.mjs`
- `docs/RECURSOS_MDT_PDF_FRONTEND_PATCH.md`

## Archivos completos modificados
- `lib/course-workspace/mdt-resources.ts`
- `app/api/mdt-resources/courses/[id]/[[...resource]]/route.ts`
- `components/campus/mdt-student-documents.tsx`
- `components/campus/mdt-institutional-pdfs.tsx`
- `app/globals.css`
- `tests/mdt-resources.test.mjs`
- `docs/RECURSOS_MDT_FRONTEND.md`
- `docs/DISENO_Y_BRANDING.md`
- `docs/DECISIONES_Y_CAMBIOS.md`
- `README.md`

## Precauciones de instalación

- **Backend:** primero debe estar instalado `Athena_Backend_Recursos_MDT_PDF_Unico_Visor_PATCH_20261121.zip`, con Alembic en `20261121_0003 (head)`; este frontend requiere los campos `requires_pdf_update` y `preview_url` en los contratos.
- Haz backup de los archivos; extrae en la **raíz del frontend que ya tiene Recursos MDT**.
- Mantén `file` (PDF institucional) y `files` (Homework de alumno) como nombres de campos multipart.
- No hay nuevas dependencias, migraciones, `.env`, Dockerfile ni nginx.
- Corre `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`; si usas Compose, reconstruye imágenes del frontend.
- Verifica permisos en un segundo tenant. No uses la URL backend como `src` del iframe ni sustituyas la cookie HttpOnly por un token en query.

## Checklist manual

- Un archivo PDF de 25 MiB exactos es válido; uno mayor falla.
- Un PNG, ZIP, dos PDF o archivo renombrado inválido no se guarda.
- «Ver PDF» abre iframe con `Content-Disposition: inline`; «Descargar PDF» devuelve `attachment`.
- Reemplazo de Homework por ADMIN/TEACHER respeta matrícula y estado; historial se conserva.
- Archivos previos no PDF o múltiples: muestra `requires_pdf_update`, permite descarga voluntaria y reemplazo por PDF.
- PDF institucional de bloque inactivo sigue accesible a ADMIN/TEACHER, nunca a STUDENT.
- Cierre del modal por botón, Escape o backdrop; el foco regresa al elemento previo.

**Regresión:** Homework académico no cambia porque las validaciones de PDF único se aplican a Recursos MDT; el frontend académico general permanece intacto.
