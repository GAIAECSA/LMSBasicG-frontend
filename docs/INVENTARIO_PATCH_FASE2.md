# Inventario del ZIP incremental — Fase 2

Colocar los archivos en la raíz del frontend existente y aceptar sobrescribir coincidencias. **No incluye archivo de backend**.

## Archivos modificados (completos, no diferencias/diffs)

- `README.md`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/campus/page.tsx`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/session/route.ts`
- `components/auth/login-form.tsx`
- `components/auth/campus-client.tsx`
- `lib/auth/server.ts`
- `app/globals.css`
- `docs/DECISIONES_Y_CAMBIOS.md`
- `docs/CONTRATO_BACKEND.md`
- `docs/VERIFICACION.md`

## Archivos nuevos

- `lib/auth/backend.ts`
- `lib/auth/types.ts`
- `components/auth/session-monitor.tsx`
- `components/auth/policy-wizard.tsx`
- `components/public/cookie-notice.tsx`
- `app/policies/page.tsx`
- `app/api/policies/pending/route.ts`
- `app/api/policies/versions/[versionId]/html/route.ts`
- `app/api/policies/versions/[versionId]/pdf/route.ts`
- `app/api/policies/versions/[versionId]/accept/route.ts`
- `docs/AUTENTICACION_Y_POLITICAS.md`
- `docs/INVENTARIO_PATCH_FASE2.md`
- `tests/auth-phase2.test.mjs`

No hay archivos a borrar. `components/public/home-client.tsx`, `lib/tenant/*`, Dockerfile, Compose y Nginx se conservan idénticos para mantener la apariencia original y red Docker ya operativa.
