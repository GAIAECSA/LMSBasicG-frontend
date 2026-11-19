# Inventario del PATCH — Fase 3 (2026-11-18)

**Instalación:** extraer el ZIP en la **raíz del frontend Fase 2**, donde se encuentran `package.json`, `compose.yaml`, `app/` y `lib/`. Aceptar reemplazar los archivos incluidos. Todos los archivos incluidos son **completos**, no diffs parciales. No borrar archivos que no aparecen aquí.

**Docker/infra:** no se incluye ni cambia `.env`, `compose.yaml`, `Dockerfile`, `nginx/`, `package.json` ni `package-lock.json`. Mantener `BACKEND_INTERNAL_URL` y `BACKEND_UPSTREAM` ya probados con tu instalación local. El backend no se modifica.

## Archivos nuevos y modificados

| Archivo | Estado | Qué hace y por qué |
|---|---|---|
| `app/campus/policies/page.tsx` | Nuevo | SSR autoriza por tenant, sesión, policies y rol antes de montar el módulo. |
| `components/campus/campus-shell.tsx` | Nuevo | Barra lateral del LMS con marca de la academia, Inicio y submenú Políticas por rol; otros módulos inactivos. |
| `components/campus/admin-policies.tsx` | Nuevo | Tarjetas CLIENT, histórico, publicación de tipos y versiones HTML/PDF; sin edición ni borrado. |
| `components/campus/my-policies.tsx` | Nuevo | Tarjetas de políticas del usuario, incluidas informativas, ATHENA y últimas aceptaciones. |
| `components/campus/policy-viewer.tsx` | Nuevo | Visor privado HTML/PDF (iframe aislado para HTML). |
| `components/auth/campus-client.tsx` | Modificado | Conserva «Llegaste» dentro de la nueva barra lateral. |
| `app/globals.css` | Modificado | Estilos responsive de shell, cards y editor; superficies neutras y acento del tenant. |
| `lib/policies/types.ts` | Nuevo | DTO y reglas de vigencia; identidad de tipos sin IDs mágicos. |
| `lib/policies/backend.ts` | Nuevo | Lecturas FastAPI ADMIN y usuario, validación de DTOs, concurrencia limitada. |
| `lib/policies/route-guard.ts` | Nuevo | Guardia BFF de sesión y rol verificado por backend. |
| `app/api/policies/admin/catalog/route.ts` | Nuevo | GET de tipos+historial ADMIN bajo tenant. |
| `app/api/policies/admin/route.ts` | Nuevo | POST de un nuevo tipo CLIENT. |
| `app/api/policies/admin/[policyId]/versions/html/route.ts` | Nuevo | POST de versión HTML inmutable. |
| `app/api/policies/admin/[policyId]/versions/pdf/route.ts` | Nuevo | POST de versión PDF privada, max. 25 MiB. |
| `app/api/policies/catalog/route.ts` | Nuevo | GET de vigentes visibles + historial de aceptaciones de ese usuario. |
| `app/api/policies/versions/[versionId]/html/route.ts` | Modificado | El lector existente ahora permite histórico autorizado además de pendientes. |
| `app/api/policies/versions/[versionId]/pdf/route.ts` | Modificado | Igual, con stream PDF sin exponer storage privado. |
| `lib/auth/backend.ts` | Modificado | Permite timeout personalizado para subir PDF, sin alterar validación Bearer. |
| `lib/auth/types.ts` | Modificado | Allowlist de roles exactos del seed; prepara ingreso STUDENT/COURSE después de cambio backend. |
| `lib/auth/server.ts` | Modificado | Sustituye rechazo genérico de scope COURSE por allowlist; backend sigue siendo autoridad. |
| `app/api/auth/login/route.ts` | Modificado | Idem: no bloquear los roles del seed si FastAPI los permite en el futuro. |
| `tests/policies-phase3.test.mjs` | Nuevo | Pruebas de roles, DTO, vigencia y restricciones de acciones. |
| `docs/MODULO_POLITICAS_FASE3.md` | Nuevo | Descripción completa del flujo, API, decisiones, seguridad y pendientes backend. |
| `docs/AUTENTICACION_Y_POLITICAS.md` | Modificado | Aclara que el frontend ya prepara `COURSE`, pero el backend aún bloquea esos roles. |
| `docs/DECISIONES_Y_CAMBIOS.md` | Modificado | Bitácora qué/cómo/por qué. |
| `docs/CONTRATO_BACKEND.md` | Modificado | Rutas y respuestas reales usadas. |
| `docs/VERIFICACION.md` | Modificado | Pruebas pasadas y límites. |
| `README.md` | Modificado | Enlace a nueva ruta y documentación de fase. |
| `docs/INVENTARIO_PATCH_FASE3.md` | Nuevo | Este inventario de sobrescritura. |

## Aplicar y comprobar en Windows PowerShell

1. Extraer todos los archivos del ZIP a `C:\proyectosPersonales\LMSBasicG-frontend\`, conservando las carpetas.
2. Desde esa carpeta, ejecutar:

```powershell
docker compose up -d --build
docker compose logs --tail=80 frontend
```

3. Ingresar en `http://127.0.0.1:8080/campus` y luego `http://127.0.0.1:8080/campus/policies` (Business `tenant_domain = 127.0.0.1`).
4. Para pruebas de publicación, utilizar ADMIN/PLATFORM y aceptar las políticas obligatorias antes de acceder al módulo. Consultar la guía técnica para otras pruebas.

**Importante:** se requiere Fase 2 previamente instalada. No sustituir el proyecto entero por este PATCH, ni modificar el backend automáticamente. Compilación Next/Docker completa aún no verificada en el entorno de entrega.
