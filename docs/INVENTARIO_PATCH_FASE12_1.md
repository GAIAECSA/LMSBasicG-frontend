# Inventario patch frontend fase 12.1

## Archivos modificados (5)

1. `app/api/course-workspace/[id]/[...resource]/route.ts` — Rutas de lote, vista previa y búsqueda, verificación de cuerpos JSON mayores y permisos.
2. `components/campus/course-attendance-manager.tsx` — Vista previa y generación transaccionales mediante FastAPI.
3. `components/campus/course-enrollments-manager.tsx` — Búsqueda paginada y matrículas atómicas, sin crear usuarios fila por fila.
4. `lib/course-workspace/bulk-enrollment.ts` — Impedir truncar archivos Excel de más de 300 filas.
5. `docs/DECISIONES_Y_CAMBIOS.md` — Registra decisiones y prioridad por cédula.

## Archivos nuevos (4)

1. `lib/course-workspace/phase12-contract.ts` — DTOs, conversión de días y validación ligera de las respuestas.
2. `tests/course-workspace-phase12.test.mjs` — Pruebas de regresión del contrato fase 12.
3. `docs/FASE12_1_FRONTEND_LOTES_ATOMICOS.md` — Guía integral de esta migración.
4. `docs/INVENTARIO_PATCH_FASE12_1.md` — Inventario de este patch.

No cambiar `public/plantilla_matricula_es.xlsx`, CSS, `package.json`, `package-lock.json` ni el backend de fase 12. El ZIP trae archivos completos, no diffs.
