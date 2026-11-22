# Athena — Inventario del parche Calificaciones FRONTEND

**Versión:** 21/11/2026. No incluye backend ni otros módulos.

## Archivos NUEVOS

- `app/api/courses/[id]/grades/route.ts`
- `lib/course-workspace/grades.ts`
- `components/campus/course-grades.tsx`
- `components/campus/course-grades.module.css`
- `tests/course-grades.test.mjs`
- `docs/CALIFICACIONES_FRONTEND.md`

## Archivos MODIFICADOS (sustituir completos)

- `app/campus/courses/[id]/[section]/page.tsx`
- `README.md`
- `docs/DISENO_Y_BRANDING.md`
- `docs/DECISIONES_Y_CAMBIOS.md`

## Regla fundamental

Únicamente Quiz y Homework activos **con `lesson_id IS NOT NULL`**. No mostrar ni contar Homework/Quiz de raíz ni recursos MDT. Solo alumnos `ACEPTADO` con rol `STUDENT`. Notas calculadas en FastAPI y acceso de solo lectura ADMIN/TEACHER.

## Requisito backend

**Instalar el parche corregido** `Athena_Backend_Calificaciones_CORREGIDO_Sin_Bloques_Raiz_20261121.zip` antes del frontend. No usar el primer ZIP backend de calificaciones.

## Procedimiento

Extraer el ZIP en la raíz del frontend actual. Ejecutar `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`. Reconstruir servicio Docker frontend. No se requiere nueva migración Alembic ni cambiar `.env`/Nginx.

**Nota de validación:** Las pruebas Node del parche pasaron; el build/typecheck/lint completos deben ejecutarse en tu instalación con dependencias npm.
