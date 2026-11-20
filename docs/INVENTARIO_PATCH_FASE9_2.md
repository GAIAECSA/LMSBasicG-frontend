# Inventario de archivos — Patch frontend Fase 9.2

**Base requerida:** frontend Athena con fases 7, 8.1 y 9 aplicadas, incluido el fix de tipos `WorkspaceResult` de la fase 9. No volver a instalar los ZIP anteriores ni borrar archivos.

## Nuevos

- `components/campus/course-type-transition.tsx` — Tarjeta independiente y segura de conversión MOOC/MDT, con preview y confirmación.
- `tests/course-workspace-phase9-2.test.mjs` — Cuatro pruebas de regresión de navegación y transición.
- `docs/FASE9_2_SIDEBAR_CAMBIO_TIPO.md` — Contrato completo, reglas y verificación.
- `docs/INVENTARIO_PATCH_FASE9_2.md` — Este inventario.

## Modificados (archivo íntegro en el ZIP)

- `components/campus/campus-shell.tsx` — Menú de curso compacto, identificación de sidebar y enlace activo dentro de la zona con scroll.
- `components/campus/admin-course-detail.tsx` — Integración de la tarjeta al final de Configuraciones; impide conversión con formulario sin guardar, y sincroniza tipo/menú tras confirmación.
- `app/globals.css` — Altura de viewport dinámica, scroll interno del menú, compactación del sidebar de curso y estilos adaptados al branding del panel de modalidad.
- `docs/AULA_FASE9.md` — Registra contrato de conversión y el backend docente Fase 9.1 ya implementado.
- `docs/DECISIONES_Y_CAMBIOS.md` — Decisiones de arquitectura documentadas para próximas migraciones.
- `docs/DISENO_Y_BRANDING.md` — Restricciones visuales para sidebar y operaciones de modalidad.

**Total: 10 archivos: 4 nuevos y 6 modificados.**

## Requisitos

Backend ya expone `POST /api/v1/courses/{id}/course-type/preview` y `POST /api/v1/courses/{id}/course-type/change` (disponibles en la arquitectura refactorizada). No se necesita migración de base de datos ni backend nuevo.

## Instalar

Extraer el ZIP en la raíz de `LMSBasicG-frontend` conservando rutas, sobrescribiendo los seis archivos modificados. Ejecutar:

```powershell
npm test
npm run typecheck
npm run lint
npm run build
docker compose up -d --build
```

No reescribir `/app/campus/courses/[id]/layout.tsx` ni `/[section]/page.tsx`: siguen siendo los que corrigieron en el fix anterior.
