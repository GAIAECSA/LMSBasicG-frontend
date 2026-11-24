# Fase 3 — Barra lateral + módulo Políticas (ADMIN / otros usuarios)

Fecha: **2026-11-18**. El backend se inspeccionó desde `Athena-Back-LMS-real-SAAS.zip` **sin modificarlo**. Esta entrega es **PATCH incremental**, no un proyecto nuevo ni un ZIP del backend.

## Resultado funcional y ruta

- `/campus`: conserva **Llegaste** como pantalla de inicio temporal, pero ahora dentro de la barra lateral basada en las capturas. Los demás módulos del menú se muestran deshabilitados, sin rutas ficticias. La barra se adapta a móvil.
- `/campus/policies`: vista compartida que verifica tenant, sesión, políticas pendientes y `role.code` + `role.scope` desde FastAPI:
  - `ADMIN`/`PLATFORM`: **Administración → Políticas**. Solo ve las políticas `CLIENT` de su `business_id`, agrupadas en tarjetas por tipo/código; ve versión vigente, toda la historia y HTML/PDF en modo lectura. Únicamente puede **crear un tipo con su primera versión y publicar versiones adicionales**. No se implementa modificar, eliminar, cancelar, reactivar o editar versiones históricas.
  - Otros usuarios (en especial `STUDENT`): **Información → Políticas**. Ve la versión vigente de cada tipo que le corresponde de `ATHENA` o `CLIENT`: las obligatorias aceptadas, las informativas y, para tipos que ya no figuren vigentes, la **última versión aceptada** obtenida de su historial. No dispone de acciones de publicación ni aceptación opcional. Si aparecen nuevas obligatorias, es redirigido al wizard `/policies` de Fase 2.
- Se preservan las cookies `HttpOnly`, navegación ligada a tenant por dominio, branding dinámico, políticas de aceptación secuencial y Docker/Nginx de fases anteriores. No se altera la portada.

## Qué se hizo, cómo y por qué

| Qué | Cómo | Por qué |
|---|---|---|
| Barra lateral por rol | `CampusShell` client reutilizable con `TenantPublic`, `AuthUser`, `SessionMonitor`, logo y CSS neutro; `/campus` y `/campus/policies` la comparten. | Un solo menú para el LMS, sin crear paneles duplicados por academia. La identidad es la del tenant, no ATHENA. |
| Restricción administrativa | SSR verifica `authState` y `isTenantAdmin`. El BFF ADMIN vuelve a ejecutar `authState` y FastAPI usa `require_admin` y filtra `business_id`/`provider=CLIENT`. | Ocultar botones es insuficiente: proteger también todos los endpoints y evitar acceso a políticas globales. |
| Catálogo administrativo | `GET /api/policies/admin/catalog` consulta `GET /api/v1/policies/admin` más `GET /api/v1/policies/admin/{id}/versions` (lotes de hasta 4 peticiones concurrentes). | FastAPI no tiene aún un endpoint combinado; el frontend necesita tarjetas con versión actual e historia. |
| Publicación | `POST /api/policies/admin` crea el tipo `{code,title,mandatory}` (solo si es nuevo), después `POST /api/policies/admin/{id}/versions/html` JSON o `/pdf` multipart. Se omite `effective_at` (se publica ahora). | Reutilizar exactamente los contratos actuales sin permitir modificaciones/despublicaciones de documentos previos. |
| Vigencia e historial | `currentVersion()` elige la versión `is_published` más reciente con `effective_at <= ahora`. Históricas siguen `is_published=true`, **no se les cambia esa bandera**, y la UI las marca como «Histórica». | FastAPI calcula vigencia temporal; actualizar `is_active=false` en versiones antiguas rompería su modelo de auditoría. |
| Consulta de usuario | `GET /api/policies/catalog` combina `GET /api/v1/policies` y `GET /api/v1/policies/acceptances/me`. Se renderiza una tarjeta por política actual, y la última aceptación histórica para tipos ya no visibles. | Las políticas informativas no requieren aceptación; los documentos obligatorios sí, según la respuesta real del backend. |
| Histórico HTML/PDF protegido | Se ajustaron BFF `/api/policies/versions/{id}/html|pdf` para lectura de cualquier versión que FastAPI autorice (actual, aceptada anteriormente o propia de ADMIN). HTML se muestra sanitizado por backend en iframe `sandbox` con CSP; PDF es streaming privado. | Antes el BFF solo permitía consultar **pendientes**, lo que impedía inspeccionar versiones aceptadas o históricas. |
| Colores de tenant con fondos neutros | Se usan las variables `--tenant-primary`, `--tenant-on-primary` para acentos y acciones. Sidebar y fondos del módulo se conservan azul pizarra / blanco / grises. | Evitar combinaciones ilegibles incluso si una academia personaliza su color con valores intensos o poco comunes. |
| Documentación y verificaciones | Esta guía, la bitácora, `INVENTARIO_PATCH_FASE3.md`, `tests/policies-phase3.test.mjs`, comentarios en control de sesión y publicación. | Asegurar continuidad cuando se migren los siguientes módulos. |

## Endpoints FastAPI reales utilizados

| Operación | Método y ruta | Quién |
|---|---|---|
| Listar tipos propios | `GET /api/v1/policies/admin` | `ADMIN/PLATFORM` |
| Crear tipo CLIENT | `POST /api/v1/policies/admin` | `ADMIN/PLATFORM` |
| Versiones del tipo | `GET /api/v1/policies/admin/{policy_id}/versions` | `ADMIN/PLATFORM` |
| Publicar HTML | `POST /api/v1/policies/admin/{policy_id}/versions/html` | `ADMIN/PLATFORM` |
| Publicar PDF | `POST /api/v1/policies/admin/{policy_id}/versions/pdf` | `ADMIN/PLATFORM` |
| Vigentes visibles al usuario | `GET /api/v1/policies` | Sesión validada |
| Historial de aceptaciones | `GET /api/v1/policies/acceptances/me` | Sesión validada |
| Ver contenido HTML/PDF | `GET /api/v1/policies/versions/{version_id}/html|pdf` | Backend controla vigente / aceptada / ADMIN propia |

**Nota de la interfaz:** un «tipo» corresponde a `Policy.code`. Una «versión» corresponde a una fila `PolicyVersion`. La UI no muestra/ejecuta `PATCH`, `DELETE` ni `POST /cancel`; esos endpoints existentes del backend no se invocan en esta fase.

## Necesidades detectadas en backend (no incluidas en el ZIP)

1. **Autenticación de estudiantes/docentes con roles `COURSE` (bloqueante si esos usuarios tienen solo ese rol).** El seed define `STUDENT` y `TEACHER` con `scope=COURSE`, pero `app/services/auth_service.py`, `app/utils/jwt.py`, y el frontend de Fase 2 (`lib/auth/server.ts`, `/api/auth/login`) exigen `PLATFORM`. Por ello **solo se puede verificar la pantalla estudiante con un usuario que el backend actual permita autenticar**; debe definirse un modelo coherente de roles globales vs roles por curso, actualizar backend y después retirar las restricciones correspondientes del BFF. No otorgar permisos ADMIN por error.
2. **Alta de tipo + primera versión transaccional (recomendado).** Son dos requests. Si falla la segunda, el tipo queda creado sin versión; la interfaz avisa y permite reintentar en el mismo formulario o desde la tarjeta. Para atomicidad se necesitaría endpoint backend que cree ambas en una sola operación. **No es imprescindible** para usar la primera fase.
3. **Listado ADMIN con versiones en una sola llamada (recomendado para cientos de políticas).** Actualmente se requiere N+1 de lectura en lotes de cuatro; crear `GET /api/v1/policies/admin/catalog` reduciría rondas y latencia a escala.
4. **`content_format` en historial de aceptaciones (opcional).** El DTO `AcceptanceHistoryRead` no incluye formato. Para ver una versión histórica ya inactiva la UI prueba HTML y ante 409 abre PDF. Un campo explícito evitaría esa petición extra.
5. **Refresh/rotación de token (pendiente de fase 2).** El backend sigue sin endpoint para renovación. No se implementa una renovación falsa del lado del frontend.

No hace falta modificar la lógica de versiones de FastAPI para satisfacer **una versión vigente por tipo**: ya la calcula con `effective_at`, manteniendo inmutabilidad e histórico.

## Casos de validación manual con Docker

1. Aplicar el ZIP sobre **Fase 2**, que ya tienes funcionando, manteniendo `.env`, Docker, backend y las carpetas existentes.
2. `docker compose up -d --build` y abrir `http://127.0.0.1:8080/login`; autenticar administrador `ADMIN/PLATFORM` de ese tenant, aceptar sus políticas si las hay.
3. Entrar a `http://127.0.0.1:8080/campus/policies`, comprobar menú Administración → Políticas y tarjetas solo `CLIENT`. Las de ATHENA nunca deben salir en la administración.
4. Publicar un HTML obligatorio: código nuevo, título, versión `1.0`, contenido con párrafos. Comprobar versión vigente, que la sesión pasa a `/policies` para aceptar y que al regresar se ve la tarjeta/historial.
5. Publicar una segunda versión `1.1` del mismo tipo, comprobar que `1.0` es «Histórica» y se puede visualizar íntegramente, sin modificarla. Comprobar que ahora `1.1` requiere nueva aceptación.
6. Publicar una política informativa con PDF pequeño (máximo 25 MiB). Confirmar que se ve y abre el PDF de forma privada; no exige aceptación.
7. Acceder como usuario estudiante cuando el backend admita `STUDENT`, verificar Información → Políticas; mostrar Global ATHENA + CLIENT, obligatorias aceptadas + informativas; impedir `/api/policies/admin` con HTTP 403.
8. Repetir con dos tenants/domínios. No deben cruzarse políticas, aceptaciones, branding, roles, versiones ni cookies. También probar 401 por revocación y 428 tras publicar política obligatoria.
9. Probar los colores extremos de `branding_config.colors.primary` (por ejemplo amarillo fuerte y azul oscuro): campos, texto y tarjetas permanecen neutrales y botones respetan `onPrimary` del tema.
10. Verificar móvil, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` y logs de Docker antes de producción.

## Límites de la entrega

Las 18 pruebas automatizadas son unitarias/estáticas, no E2E. Se verificó sintaxis TS/TSX mediante TypeScript global; **no** se pudo instalar todas las dependencias ni hacer build Next.js completo en este entorno, por falta de acceso confiable al registro npm. Es indispensable compilar y probar en el equipo del proyecto.

### Preparación de roles COURSE en el frontend (incluida en este PATCH)

Se modificaron además `lib/auth/types.ts`, `lib/auth/server.ts` y `app/api/auth/login/route.ts` para aceptar **exclusivamente las parejas de código/alcance definidas por el seed** (`ADMIN/PLATFORM`, `VISITOR/PLATFORM`, `TEACHER/COURSE`, `STUDENT/COURSE`), siempre **después** de que FastAPI autentique al usuario, valide JWT y revoque sesiones. Esto evita que, una vez corregido el backend, el frontend siga rechazando a estudiantes. **No habilita el login de STUDENT/TEACHER hoy**: FastAPI conserva el bloqueo en `auth_service.login` y `resolve_user_session`. La vista ADMIN y sus APIs siguen exigiendo `ADMIN/PLATFORM` exacto.
