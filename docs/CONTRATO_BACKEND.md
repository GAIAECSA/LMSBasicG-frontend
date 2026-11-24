# Contratos del backend revisados (solo lectura)

Origen: `Athena-Back-LMS-real-SAAS.zip` entregado en esta conversación. **El backend no está incluido ni fue editado**.

## Resolución por dominio

`GET /api/v1/tenant/resolve?domain=campus.academia.com`

Campos usados: `id`, `name`, `tenant_domain`, `logo_url`, `branding_config`, `matched_domain`. El hostname enviado es el recibido por Nginx, sin el puerto. La respuesta debe confirmar el mismo `matched_domain`, `matched_domain_type=TENANT` y `tenant_domain=hostname`. `landing_domain` no habilita la portada LMS.

`logo_url` se obtiene como `/api/v1/tenant/logo?domain=...` (no se publica el path privado del disco).

## Cursos del tenant

`GET /api/v1/courses/public/landing?domain=<tenant_domain>`

Devuelve `CoursePublicResponse[]` con `id`, `name`, `description`, `price`, `is_free`, `level`, `image_url`, `discount_price`, `currency`, `duration_hours`. Ya está filtrado por publicación/inscripción según backend. No volver a filtrar por `is_published` en frontend: el DTO público no incluye ese campo.

## Autenticación

- `POST /api/v1/auth/login` con `username`, `password`, `domain` (tenant canónico).
- `GET /api/v1/users/me` con `Authorization: Bearer` para comprobar sesión y `business_id`.
- `POST /api/v1/auth/logout` con el mismo Bearer.

El frontend gestiona una cookie `httpOnly`, `host-only`, `SameSite=Lax`, con token emitido por FastAPI. El token **no** se expone a JavaScript del navegador. No se implementó registro abierto porque **no existe** endpoint público equivalente en este backend (`POST /api/v1/users` requiere ADMIN).

## Ajustes en backend potenciales, pero NO realizados

1. **Editor de branding:** aún no hay endpoint administrativo para guardar `branding_config`. Hay que añadir un PATCH autenticado que valide colores/texto, audite cambios y bloquee la edición cruzada de tenants. El administrador puede cargar `logo_url` mediante `/api/v1/tenant/admin/logo` existente.
2. **Dominios personalizados:** validación de titularidad DNS, proceso de alta, certificado y desactivación deben tener workflow seguro en infraestructura/administración. El endpoint de resolución por sí solo no gestiona TLS.
3. **Autorización del resto del campus:** los módulos administrativos/frontend antiguo NO se han migrado; al volver a habilitarlos, consumir los endpoints nuevos, enviar sesión mediante BFF y confirmar business_id en cada acción. No hacer acceso directo a datos privilegiados de otro tenant.
4. **Storage y escalado horizontal:** el backend utiliza archivos locales. Para varias réplicas necesitará almacenamiento compartido/objeto, sin exponer archivos privados.


## Fase 2 — autenticación, políticas y módulos (revisión de código exacto)

- `POST /api/v1/auth/login`: devuelve `{access_token,token_type,expires_at,user}`. `user.role` tiene `id,code,name,scope`; `user.business_id` debe ser igual al business resuelto. FastAPI crea `AuthSession(session_id=jti, expires_at)` y valida su revocación en cada request.
- `GET /api/v1/policies/pending`: devuelve `UserPolicyRead[]` (entre otros `version_id`, `title`, `content_format` = `HTML|PDF`, `mandatory`, `needs_acceptance`). Está exceptuado del gate `428`, igual que `GET /policies/versions/{id}/html|pdf`, `POST /versions/{id}/accept` y POST logout.
- `GET /api/v1/users/me`: devuelve `UserResponse.role`, `role_id`, `business_id`; **solo disponible cuando ya no hay pendientes**.
- `GET /api/v1/business-lms-config/me/modules`: lista `BusinessModuleResponse[]` con `id,code,name,description,config`, filtrado por negocio de la sesión y activo; proviene del join `business_lms_config` + `lms_configs`; no incluye `secret_config`. También bloqueado por `428`.
- **No existen** endpoints para `/auth/refresh`, rotación de token ni cambio de vencimiento en una sesión activa. Por defecto el JWT vence a los 60 min configurables; actualizar `last_used_at` no extiende `expires_at`.
- **Rol de seed:** `ADMIN` y `VISITOR` tienen `scope=PLATFORM`; `TEACHER`/`STUDENT` tienen `scope=COURSE`. `auth_service.login` y `resolve_user_session` solo admiten `PLATFORM`; falta diseñar acceso para otros roles si serán usuarios del campus.

El frontend no modificó el backend. La ampliación necesaria para refresh y los alcances por rol están detallados en [Autenticación y políticas](AUTENTICACION_Y_POLITICAS.md).

## Contrato adicional: Fase 3 — Políticas del campus (2026-11-18)

- Listado administrativo `GET /api/v1/policies/admin`: `[TenantPolicyRead]` = `{id,code,title,mandatory,is_active}`; **solo políticas CLIENT del business autenticado**.
- Historial por tipo `GET /api/v1/policies/admin/{id}/versions`: `[PolicyVersionRead]` = `{id,policy_id,version,title,content_format,effective_at,published_at,content_sha256,is_published}`.
- Alta de tipo `POST /api/v1/policies/admin`: `{code,title,mandatory}`; código único por tenant y no puede colisionar con uno GLOBAL ATHENA activo.
- Publicar nueva versión HTML `POST /api/v1/policies/admin/{id}/versions/html`: `{version,html_content,effective_at:null}` (el backend sanitiza HTML).
- Publicar PDF `POST /api/v1/policies/admin/{id}/versions/pdf`: `multipart/form-data` con `version` y `file`, `effective_at` omitido. Máximo 25 MiB, privado.
- Listado de visibles `GET /api/v1/policies`: `[UserPolicyRead]` con `provider`, `mandatory`, `accepted`, `accepted_at`, `needs_acceptance`, `version_id`, `content_format`.
- Historial individual `GET /api/v1/policies/acceptances/me`: `[AcceptanceHistoryRead]` sin `content_format`.
- Lectura `GET /api/v1/policies/versions/{id}/html|pdf`: FastAPI permite vigente, aceptada histórica o ADMIN del tenant CLIENT. El BFF ya no limita a pendientes, pero no abre documentos de otros tenants.
- La versión vigente **no** implica que otras tengan `is_published=false`. FastAPI selecciona la fecha de vigencia más reciente; las anteriores permanecen publicadas para histórico.
- `POST /api/v1/policies/admin` y publicación de primera versión son operaciones **separadas, no atómicas**. Potencial mejora del backend documentada en `MODULO_POLITICAS_FASE3.md`.
