# Athena LMS — Reportes MDT V2 (frontend)

Implementación de la sección `Reportes` de un curso MDT para `ADMIN`. No aparece en MOOC ni en la navegación del rol TEACHER.

## Diseño

Seis tarjetas: Estructura (1), Documentos (4), Asistencias (2), Evaluaciones/notas (4), Encuestas (2), Certificados MDT (1). Una tarjeta de varios reportes se despliega y permite generar uno de sus PDFs de manera independiente. Las tarjetas unitarias descargan directamente. Se preserva el sistema de branding institucional (`--tenant-*`, clases LMS).

Los cuatro reportes de notas muestran una selección de Quiz/Homework **solo en memoria** por cada generación. La vista `Notas finales` bloquea deselección de toda actividad `counts_toward_grade` y permite incluir/excluir actividades formativas. En cada apertura se restablecen valores predeterminados.

Las rutas Next.js actúan como BFF con cookie HttpOnly. Antes de reenviar una consulta validan sesión, aceptación de políticas y pertenencia del usuario ADMIN al curso MDT; el backend repite los controles. Las descargas PDF se obtienen mediante la misma cookie, con `no-store`, sin exponer JWT ni URLs directas de FastAPI al navegador.

## Nuevas rutas y archivos

- `app/api/course-reports/[id]/[...resource]/route.ts`: GET `catalog` y GET `<report_code>/pdf`.
- `lib/course-reports/catalog.ts`: contrato estricto y seis grupos de reportes.
- `components/campus/course-reports.tsx`: pantalla, filtros y descargas.
- `components/campus/course-reports.module.css`: responsive y tematización.
- `app/campus/courses/[id]/[section]/page.tsx`: integra la ruta `reports`.
- `tests/course-reports-v2.test.mjs`: pruebas de grupos, catálogo y validación de selección.

## Aplicar

El backend de reportes MDT V2 debe estar instalado y desplegado. Extraer ZIP frontend en la raíz del proyecto Next.js, sobrescribir rutas relativas, y ejecutar:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

Después comprobar en Docker un ADMIN MDT; un ADMIN MOOC, TEACHER y VISITOR no deben acceder a la sección; una URL directa al BFF debe fallar con HTTP 401/403 si no hay permisos. Generar 14 PDFs con curso que tenga alumnos, docentes, evaluaciones y encuestas. Comprobar branding, rutas PDF, fechas y estados.

**Nota de validación:** durante la construcción del parche el entorno de ejecución no pudo instalar todas las dependencias npm; las pruebas completas Next.js, typecheck y build en Docker deben repetirse localmente, y no se consideran aprobadas de antemano.
