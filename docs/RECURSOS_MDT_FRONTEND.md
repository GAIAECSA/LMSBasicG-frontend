# Athena — Recursos MDT (Frontend, PDF único + visor privado)

**Versión vigente:** actualización incremental del frontend de Fase 13, basada en `LMSBasicG-frontend-real-SAAS.zip` + `Athena_Frontend_Recursos_MDT_PATCH_20261121.zip`.

**Backend requerido:** `Athena_Backend_Recursos_MDT_PATCH_20261121.zip` y luego `Athena_Backend_Recursos_MDT_PDF_Unico_Visor_PATCH_20261121.zip`; Alembic permanece en `20261121_0003 (head)`. No se requiere migración nueva para el visor.

## Reglas de negocio

- Dentro de un curso MDT, ADMIN y TEACHER matriculado y aceptado acceden a una sola sección **Recursos MDT**, con pestañas **Archivos de estudiantes** y **Evidencias institucionales**. Los bloques existen previamente, son raíz (`course_id` presente, `lesson_id = NULL`) y no se crean desde esta interfaz.
- **Archivos de estudiantes:** bloques `homework` raíz MDT. Cada STUDENT aceptado tiene a lo sumo una entrega por requisito y **un único adjunto PDF válido de máximo 25 MiB**. ADMIN y TEACHER pueden subirlo o reemplazarlo por matrícula. El estudiante puede reemplazar sus propios documentos según el backend de Homework, aun si los subió personal; su pantalla estudiantil se implementará cuando se migre el aula.
- **Evidencias institucionales:** bloques `pdf` raíz MDT, un PDF por bloque, de máximo 25 MiB; solo ADMIN/TEACHER pueden acceder a ellos. Un bloque inactivo sigue siendo gestionable por el personal.
- No se exige calificación, no se modifican matrículas ni se generan bloques nuevos. **Homework académico dentro de lecciones no cambia sus reglas**, pues este frontend solo administra Recursos MDT.
- La vista previa es la acción principal del documento compatible; la descarga es voluntaria desde el visor. El historial de cargas/reemplazos permanece sin alterarse.
- Los archivos anteriores no PDF o múltiples se mantienen para descarga y se muestran con el aviso `requires_pdf_update`. Al reemplazar, solo se permite subir un PDF. No se eliminan documentos históricos durante la instalación ni se garantiza conservar la versión física después de un reemplazo.

## Rutas privadas BFF (navegador → Next.js → FastAPI)

Todas empiezan con `/api/mdt-resources/courses/{courseId}` en el BFF (Next.js) y reutilizan la cookie HttpOnly de sesión. Los medios privados jamás se vinculan directamente a un URL de FastAPI ni usan URL recibida en los DTO: las referencias `preview_url` se usan únicamente para decidir si existe visor; la ruta real se deriva del ID verificado.

| Acción | BFF (sufijo) | FastAPI (`/api/v1/...`) |
|---|---|---|
| Resumen / contadores | `/` | `mdt-resources/courses/{courseId}` |
| Estudiantes por requisito | `/homework/{blockId}/students?...` | `mdt-resources/courses/{courseId}/homework/{blockId}/students` |
| Subir/reemplazar estudiante | `PUT /homework/{blockId}/students/{enrollmentId}/files` | `PUT /mdt-resources/courses/{courseId}/homework/{blockId}/students/{enrollmentId}/files` |
| Subir/reemplazar PDF institucional | `PUT /pdf/{blockId}/file` | `PUT /mdt-resources/courses/{courseId}/pdf/{blockId}/file` |
| **Previsualizar adjunto** | `GET /attachments/{attachmentId}/preview` | `GET /homework-response/attachments/{attachmentId}/preview` |
| Descargar adjunto | `GET /attachments/{attachmentId}/download` | `GET /homework-response/attachments/{attachmentId}/download` |
| **Previsualizar institucional** | `GET /pdf/{blockId}/preview` | `GET /media/lesson-blocks/{blockId}/file?preview=true` |
| Descargar institucional | `GET /pdf/{blockId}/download` | `GET /media/lesson-blocks/{blockId}/file?download=true` |
| Historial | `GET /events?...` | `GET /mdt-resources/courses/{courseId}/events` |

**Multipart:** el student staff upsert manda **exactamente un campo `files`** (plural, archivo PDF); la evidencia usa **un campo `file`** (singular). Ambos <=25 MiB. El navegador hace una validación de UX de extensión y tamaño; FastAPI valida cantidad, MIME, tamaño y firma `%PDF-`. El BFF **transmite en streaming** y corta cuerpos >25 MiB + margen multipart incluso sin `Content-Length`.

**Visor:** `components/campus/mdt-pdf-preview.tsx` contiene el modal reutilizable e `iframe` de URL *same-origin*, con botón «Abrir en otra pestaña» (fallback móvil) y «Descargar PDF». El BFF transmite los bytes sin almacenar en memoria, con `Content-Type: application/pdf`, `Content-Disposition: inline`, `Cache-Control: private, no-store`, `nosniff`, `X-Frame-Options: SAMEORIGIN`. La descarga BFF devuelve `Content-Disposition: attachment`. Un archivo legacy incompatible no obtiene visor; puede descargarse de forma explícita para corregirlo.

**Seguridad:** la consulta server-side `getCourseWorkspace()` comprueba sesión, políticas, tenant, modalidad MDT y rol; FastAPI también revalida permisos por cada PDF/adjunto. El navegador no obtiene JWT, ubicación privada, hashes de auditoría ni rutas físicas. El modal no convierte el documento en público. Los enlaces requieren sesión válida en cada petición y no siguen redirects externos.

## Archivos del parche PDF

**Agregar:** `components/campus/mdt-pdf-preview.tsx` (visor compartido), `docs/RECURSOS_MDT_PDF_FRONTEND_PATCH.md` (inventario e instalación), `tests/mdt-resources-pdf.test.mjs` (pruebas complementarias).

**Reemplazar completos:**
- `lib/course-workspace/mdt-resources.ts`: `can_preview`, `requires_pdf_update`, rutas preview, validación PDF único.
- `app/api/mdt-resources/courses/[id]/[[...resource]]/route.ts`: proxy streaming de `preview`/`download`, encabezados y cap multipart de 25 MiB.
- `components/campus/mdt-student-documents.tsx`: selector único, visor, descarga solo para legacy, aviso de actualización.
- `components/campus/mdt-institutional-pdfs.tsx`: visor para PDF válido, carga/reemplazo, tratamiento legacy.
- `app/globals.css`: estilos responsivos y tokens del tenant para modal PDF.
- `tests/mdt-resources.test.mjs`: contratos nuevos y regresión del módulo.
- `README.md`, `docs/DISENO_Y_BRANDING.md`, `docs/DECISIONES_Y_CAMBIOS.md`, `docs/RECURSOS_MDT_FRONTEND.md`: documentación normativa.

## Instalación y pruebas (PowerShell, desde la raíz frontend)

1. Aplicar antes el parche **backend PDF único + visor**, iniciar backend y comprobar que Alembic esté `20261121_0003 (head)`.
2. Respaldar los archivos frontend modificados y extraer el ZIP **en la raíz Next.js** (carpetas `app/`, `components/`, `lib/`, `tests/`, `docs/`), sobrescribiendo únicamente los archivos incluidos. No extraer en una carpeta adicional ni mezclar con el backend.
3. Ejecutar:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

4. Para Docker Compose, reconstruir el frontend y proxy usando el procedimiento del repositorio (por ejemplo `docker compose up -d --build`). **No cambiar la regla de Nginx de `/api/v1/*`**: las rutas `/api/mdt-resources/*` continúan llegando a Next.js.
5. En ADMIN y TEACHER aceptado, probar subir un PDF y rechazar 2 PDF, PNG, ZIP, más de 25 MiB y falso PDF con extensión renombrada. Abrir el visor en escritorio/móvil, luego descargar voluntariamente. Reemplazar y verificar bitácora. Comprobar que los adjuntos antiguos se muestran sin perderse y que STUDENT/otros tenants no pueden entrar al módulo ni abrir el PDF institucional con la URL copiada.

## Estado de validación

El parche se valida mediante `npm test` y comprobación sintáctica TS/TSX; la compilación completa y el flujo navegador ↔ Docker/FastAPI/PostgreSQL son verificaciones pendientes de tu entorno con dependencias instaladas. La pantalla del estudiante y la previsualización en su aula están fuera del alcance de este parche administrativo.
