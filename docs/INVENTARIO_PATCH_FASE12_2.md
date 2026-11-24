# Inventario del patch incremental — Fase 12.2

Base requerida: frontend con fases 11 y 12.1 aplicadas; backend fase 12.

## Archivos modificados (sobrescribir completos)

1. `app/api/course-workspace/[id]/[...resource]/route.ts`
   - Corrige listado, detalle de sesión, alta, edición, archivado, consulta de participantes y actualización de estados.
   - Mantiene previsualización y creación recurrente atómicas.
   - Conserva las verificaciones de curso, matrícula y rol.
2. `tests/course-workspace-phase11.test.mjs`
   - Actualiza la aserción del contrato de rutas, sin alterar las otras pruebas.
3. `tests/course-workspace-phase12.test.mjs`
   - Actualiza aserciones de recorrencia a la utilidad centralizada.
4. `docs/DECISIONES_Y_CAMBIOS.md`
   - Registra los motivos, restricciones y compatibilidad con backend.

## Archivos nuevos

5. `lib/course-workspace/attendance-api.ts`
   - Única fuente de rutas de Asistencia y enriquecimiento acotado de roles por matrícula del curso.
6. `tests/course-workspace-attendance-paths-fix.test.mjs`
   - Comprueba todos los endpoints, rutas seguras del BFF, ADMIN/TEACHER y aislamiento por curso.
7. `docs/FASE12_2_CORRECCION_ASISTENCIA.md`
   - Contratos reales FastAPI, notas de seguridad, pruebas y despliegue.
8. `docs/INVENTARIO_PATCH_FASE12_2.md`
   - Este inventario.

## No incluye ni modifica

- `components/campus/course-attendance-manager.tsx` (la pantalla existente sigue funcionando).
- `components/campus/course-enrollments-manager.tsx`, sus servicios o plantilla Excel.
- `app/api/auth/session/route.ts` (el 500 de sesión es otro problema).
- CSS, branding, Dockerfile, variables de entorno, ni backend.

## Comandos en la raíz del frontend (Windows PowerShell)

```powershell
npm test
npm run typecheck
npm run build
docker compose up -d --build
```
