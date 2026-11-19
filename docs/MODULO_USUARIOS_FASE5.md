# Athena — Fase 5: Gestión de usuarios

Fecha: 19-11-2026 · Base: `LMSBasicG-frontend-real-SAAS.zip`

## Resumen

- Administración exclusiva de cuentas `ADMIN` y `VISITOR` a nivel de plataforma.
- **STUDENT/TEACHER son roles de `Enrollment`**; no aparecen en este módulo.
- Menú `Gestión de usuarios > Usuarios` SOLO para ADMIN. No hay nuevas vistas VISITOR.
- Listado + búsqueda/filtros, alta, edición, activación/desactivación y eliminación lógica.
- SSR y BFF revalidan JWT/sesión revocable, `business_id`, aceptación de políticas y rol ADMIN.
- BFF llama exclusivamente a la API interna; el JWT está en cookie HttpOnly.
- `DELETE` en FastAPI es un soft-delete (`deleted=true`, `is_active=false`) y revoca sesiones.
- La edición administrativa **NO** cambia contraseñas de terceros (no hay endpoint backend).

## Contratos verificados en backend del ZIP

```
GET    /api/v1/users           -> UserResponse[]
POST   /api/v1/users           -> UserCreate, 201 UserResponse (SIEMPRE crea VISITOR)
GET    /api/v1/users/{id}      -> UserResponse
PATCH  /api/v1/users/{id}      -> UserAdminUpdate, UserResponse
DELETE /api/v1/users/{id}      -> 204, soft-delete
```

`UserCreate`: `username, firstname, lastname, password, idnumber?, email?, phone_number?, province?`.
`UserAdminUpdate`: campos de perfil opcionales + `is_active?`; **NO `role_code`**.
`UserResponse`: incluye `role: {id, code, name, scope}` y `business_id`; no contiene contraseña.

## Limitación y modificación necesaria en el BACKEND

Para permitir crear ADMIN y cambiar ADMIN/VISITOR mediante interfaz:

1. Extender `app/schemas/user.py`: agregar `role_code: Literal["ADMIN","VISITOR"]` a `UserCreate` (opcional con default `VISITOR` para compatibilidad); agregar `role_code: Optional[Literal["ADMIN","VISITOR"]]` en `UserAdminUpdate`. No aceptar `role_id` ni `business_id` del cliente.
2. Adaptar `app/services/user_service.py`: el alta administrativa resuelve `role_code` en `roles` con `scope="PLATFORM"` y tenant del JWT. El alta masiva de matrículas debe continuar creando únicamente VISITOR mediante su función de importación, sin permitir que input de matrícula fuerce ADMIN.
3. Al editar role_code, obtener el rol destino por código y scope, verificar que es ADMIN/VISITOR y revocar sesiones tras cambio de rol para forzar reautorización. Evitar degradación, desactivación o eliminación del último ADMIN activo del tenant y evitar autodegradación.
4. Mantener `require_admin`, y controles de `business_id` en servicios/repositorios. Las migraciones de tablas no parecen necesarias porque `users.role_id` ya existe.
5. Agregar pruebas: permisos VISITOR=403, tenant cruzado, alta ADMIN, alta VISITOR, cambios de rol, auto-democión prohibida, último ADMIN, soft-delete y revocación de sesiones.
6. **Después de desplegar ese backend**, definir `ATHENA_USERS_ROLE_ASSIGNMENT=enabled` en Next.js, reconstruir/reiniciar el frontend y validar E2E con PostgreSQL real.

La implementación frontend no envía `role_code` al backend heredado cuando esa bandera está deshabilitada. Es intencional: Pydantic descartaría el campo extra y crearía incorrectamente un VISITOR.

## Archivos

**Modificados:**
- `components/campus/campus-shell.tsx`
- `components/campus/campus-home.tsx`
- `app/globals.css`
- `.env.example`
- `tests/campus-phase4.test.mjs` (actualiza la prueba de enlaces del dashboard)

**Nuevos:**
- `app/campus/users/page.tsx`
- `app/api/users/route.ts`
- `app/api/users/[userId]/route.ts`
- `components/campus/admin-users.tsx`
- `lib/users/types.ts`
- `lib/users/permissions.ts`
- `lib/users/route-guard.ts`
- `tests/users-phase5.test.mjs`
- `docs/MODULO_USUARIOS_FASE5.md`

## Instalación

Copiar la estructura del parche sobre la raíz del repositorio frontend (no reemplazar todo el repo). Mantener las carpetas `app`, `components`, `lib`, `docs`, `tests` y el archivo `.env.example`. Ejecutar `npm ci`, `npm run typecheck`, `npm test`, `npm run lint`, `npm run build`, luego desplegar según el README del proyecto. Sin un backend actualizado, crear ADMIN/cambiar rol se mantendrá bloqueado; el resto de operaciones están disponibles.

## Decisiones

- Las cuentas se crean con contraseña inicial. Evitar enviar contraseñas por correo en texto plano; un futuro flujo de invitación/restablecimiento requeriría backend.
- Se preserva el soft-delete, que conserva historial académico. Ninguna tabla UI debe exponer `password`, hashes o claves.
- No se implementan endpoints proxy libres ni `localStorage`.
- Listado completo: adecuado para fase inicial. Cuando el volumen lo requiera, agregar paginación/consulta servidor en FastAPI y en BFF.
