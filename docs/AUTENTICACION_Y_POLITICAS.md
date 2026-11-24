# Autenticación multi-tenant y políticas obligatorias — Fase 2

Fecha: 2026-11-16. **Contrato revisado directamente contra `Athena-Back-LMS-real-SAAS.zip`. Backend sin modificaciones.**

## Flujo funcional

```text
/login (hostname y tenant resuelto por Next SSR)
  → POST /api/auth/login (BFF; nunca expone token al navegador)
     → POST FastAPI /api/v1/auth/login {username,password,domain:tenant.tenantDomain}
     → respuesta con user.role.code/scope y JWT revocable/jti (AuthSession)
     → BFF GET /api/v1/policies/pending con Bearer
     → cookie host-only HttpOnly SameSite=Lax, Secure en HTTPS
     ├── hay obligatorias pendientes → /policies
     │    → GET documento HTML/PDF (BFF con Bearer server-side)
     │    → POST /versions/{id}/accept → reconsultar pending
     │    ├── faltan → siguiente documento, uno por vez
     │    ├── no faltan → /campus
     │    └── 'No acepto' → POST /auth/logout y salida a /
     └── no hay pendientes → /campus
         → GET /policies/pending [autoridad backend]
         → GET /users/me [perfil y role {code,scope}]
         → GET /business-lms-config/me/modules [lms_configs + config por academia]
         → muestra solo 'Llegaste' + salir, sin dashboard por rol todavía
```

## Contratos usados y seguridad

| Endpoint FastAPI | Para qué | Validación |
|---|---|---|
| `POST /api/v1/auth/login` | Abre sesión y crea JWT + `auth_sessions` | `domain` obtenido de `tenant_domain` resuelto por Host, nunca del form; verifica `user.business_id`. |
| `POST /api/v1/auth/logout` | Revocar la sesión | BFF reenvía Bearer, limpia cookie incluso si FastAPI está indisponible; respuesta `revoked` indica éxito de revocación upstream. |
| `GET /api/v1/policies/pending` | Enlace seguro tras login y comprobación constante | Permitido incluso mientras el gate 428 bloquea otras APIs. |
| `GET /api/v1/policies/versions/{id}/html` | Política HTML | Backend sanitiza. Frontend muestra en iframe `sandbox` y CSP muy restrictiva. |
| `GET /api/v1/policies/versions/{id}/pdf` | Política PDF privada | BFF envía bytes por stream no-store, sin ruta de storage directa. |
| `POST /api/v1/policies/versions/{id}/accept` | Aceptación indiv. | El backend decide usuario/tenant y version actual; BFF exige same-origin y lista pendiente. |
| `GET /api/v1/users/me` | Rol de sistema | Rol identificado por `role.code`/`role.scope`, no `role_id`. Consulta solo tras políticas. |
| `GET /api/v1/business-lms-config/me/modules` | Módulos + configuración | Backend cruza `business_lms_config` y `lms_configs`; omite `secret_config`; el frontend verifica respuesta y no la usa aún para controlar paneles. |

- El token no se guarda en `localStorage`, sessionStorage, JS del cliente ni en respuestas de la API BFF. Las cookies de login llevan `HttpOnly`, `SameSite=Lax`, `Secure` con HTTPS y no tienen atributo `Domain`.
- La vinculación entre cookie y tenant descarta tempranamente cookies cuyo `business_id` del JWT no coincide con el tenant, **pero nunca autoriza con ese dato decodificado**. La autorización requiere siempre una respuesta correcta de FastAPI, que valida firma, sesión revocable y usuario actual.
- En cada navegación a `/campus` y `/policies`, el servidor verifica de nuevo los pendientes y el estado del usuario (fail-closed). El monitor del navegador consulta `/api/auth/session` al enfocar la pestaña y cada 60 segundos por UX, no como control de seguridad único.
- Si el backend está indisponible, el frontend no permite acceder a `/campus` ni marcar políticas como aceptadas y no inventa una sesión válida. Errores 428 deben reabrir `/policies` antes de habilitar dashboards futuros.
- Cada POST de sesión/políticas verifica el header `Origin` contra `Host` original. El reverse proxy debe conservar Host y no aceptar encabezados de origen arbitrarios de Internet.
- **Cookies:** aviso meramente informativo en `/`. Solo cookie de sesión indispensable y preferencia local de aviso. No existen cookies opcionales ni sistema de consentimiento de marketing. Si se integra analítica después, hará falta un diseño de consentimiento distinto y evaluación legal pertinente.

## Límite real: renovación de tokens

El backend **NO tiene** `/api/v1/auth/refresh` ni un refresh token/rotación. `app/services/auth_service.py` emite JWT corto (por defecto 60 minutos) y guarda `auth_sessions.expires_at` con el mismo vencimiento. Hacer polling de `/users/me` actualiza `last_used_at` a intervalos, pero **no extiende `expires_at`**. Tampoco es correcto emitir un JWT firmado desde Next.js ni almacenar contraseñas para re-login automático.

Por eso esta fase **detecta expiración y requiere iniciar sesión de nuevo**. Para renovación transparente, backend debe añadir un flujo seguro de refresh con token separado, almacenamiento de hash, rotación por uso, revocación por sesión/dispositivo y protección anti-replay; Next.js lo consumirá desde el BFF. **No se modificó FastAPI**.

## Límite real: roles del seed

`app/scripts/seed_initial_data.py` define:

| Rol | Code | Scope | Id semilla (no usar para permisos) |
|---|---|---|---|
| Administrador | `ADMIN` | `PLATFORM` | 1 |
| Visitante | `VISITOR` | `PLATFORM` | 2 |
| Docente | `TEACHER` | `COURSE` | 3 |
| Estudiante | `STUDENT` | `COURSE` | 4 |

En `app/services/auth_service.py`, el login rechaza usuarios cuyo rol **no sea** `PLATFORM`; `app/utils/jwt.py` hace la misma comprobación en cada sesión. Esto significa que TEACHER/STUDENT, si están asignados directamente a `User.role`, **no pueden entrar con el backend actual**. La corrección implica determinar si el rol global es distinto del rol por curso; actualizar auth y la verificación de sesión de forma coherente, sin habilitar permisos COURSE como permisos administrativos.

El frontend ya tiene tipados rol y módulos para cuando se diseñe la home por rol, pero **por ahora la salida es la misma pantalla blanca `Llegaste` para los usuarios que el backend permite autenticar**.

## Prueba manual con Docker (no modificar backend)

1. Continuar usando `.env` ya operativo con `BACKEND_INTERNAL_URL=http://host.docker.internal:9000` y `BACKEND_UPSTREAM=host.docker.internal:9000`, o el nombre de red Docker correspondiente.
2. `docker compose up -d --build` y abrir `http://127.0.0.1:8080/`. El Business debe tener `tenant_domain=127.0.0.1` para esta instalación local.
3. Verificar el aviso de cookies; al pulsar *Entendido* solo se guarda la preferencia del aviso.
4. Entrar por `/login` con un ADMIN/PLATFORM válido. Si no hay políticas pendientes, la pantalla `/campus` debe decir **Llegaste**.
5. Crear/asignar en backend una política obligatoria vigente HTML y otra PDF; tras un login, deben aparecer individualmente en `/policies`. Ver documento y aceptar primera, comprobar la siguiente. Probar también el rechazo: revoca sesión y vuelve a `/`.
6. Abrir DevTools → Application → Cookies. Comprobar cookie `athena_lms_session` HttpOnly, host-only y sin datos de usuario. No debe aparecer JWT en localStorage ni en JSON del BFF.
7. Revocar externamente la sesión (`/logout-all` como usuario conectado desde API) y recargar `/campus` → debe redirigir a `/login`.
8. En la nueva sesión, comprobar por Network que `/api/auth/session` reporta rol y módulos habilitados, sin devolver tokens, y que `/campus` no enseña dashboards aún.
9. Repetir con tenant distinto: no debe existir acceso cruzado de cookie/role/modules/identidad. En producción probar HTTPS y subdominios distintos.
10. Probar token vencido (valor backend por defecto: 60 min): requiere volver a iniciar sesión, **no** renovación silenciosa.

## Instalación del ZIP incremental

Extraer **en la raíz** del frontend original de la fase 1 (donde está `package.json`). Todos los archivos de este ZIP contienen el **contenido completo**, incluso los `.md` que se actualizaron. El ZIP no lleva `node_modules`, `dist`, `.next`, `.env`, backend ni imágenes originales. Archivos no incluidos permanecen intactos. **No borrar el código anterior por extensión**, ya que se conserva la apariencia visual aprobada.

Después: `npm ci && npm test && npm run typecheck && npm run lint && npm run build` (o `docker compose up -d --build`). Ver `docs/VERIFICACION.md` para distinguir lo comprobado de lo pendiente.

## Actualización 2026-11-18 — Preparación de roles `COURSE` en el BFF

La sección anterior registra correctamente el comportamiento de la **Fase 2 original**. En el PATCH de **Fase 3**, `app/api/auth/login/route.ts`, `lib/auth/server.ts` y `lib/auth/types.ts` se ajustan para admitir exclusivamente las parejas de rol existentes en el seed: ADMIN/PLATFORM, VISITOR/PLATFORM, STUDENT/COURSE y TEACHER/COURSE **siempre que FastAPI ya haya validado ese rol, token y sesión**. Los endpoints de administración del frontend siguen exigiendo ADMIN/PLATFORM exacto.

**La limitación real del backend sigue vigente.** `app/services/auth_service.py` y `app/utils/jwt.py` rechazan `scope=COURSE`; no basta con instalar este PATCH para iniciar sesión como estudiante/docente. Primero debe definirse y modificarse el modelo de acceso backend sin elevar permisos de los roles por curso. La UI de Información → Políticas queda preparada para el momento en que esos logins sean posibles.
