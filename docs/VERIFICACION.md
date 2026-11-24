# Verificaciones — Entrega corregida con diseño original

Fecha: 2026-11-16. Alcance: **solo frontend**; el backend del usuario no se modificó.

## Resultados verificados en este entorno

- `npm test` (Node 22 con `--experimental-strip-types`): **8 pruebas aprobadas**, incluyendo aislamiento del branding, hostname, URL de logo, placeholders, conservación de bloques del diseño, ausencia de branding fijo y correspondencia paquete/lockfile.
- **22 archivos `.ts` / `.tsx`** inspeccionados con el parser TypeScript global: sin errores de sintaxis. Este control **no equivale** a una comprobación semántica completa (`tsc`).
- Nginx de Docker: **`nginx -t` exitoso** tras renderizar `nginx/default.conf.template` con `BACKEND_UPSTREAM=127.0.0.1:9000` y reemplazar temporalmente `frontend:9001` por `127.0.0.1:9001`, únicamente para la verificación local de sintaxis. No se probaron upstreams reales.
- El lockfile contiene Tailwind v4 y PostCSS con dependencias transitivas a partir del lock original. `npm ci` **no fue ejecutable** sin acceso al registro.
- El ZIP excluye `node_modules`, `.next`, el backend y los recursos de ATHENA del frontend antiguo.

## No comprobado aquí

- **Compilación real Next.js:** `npm ci`, `npm run build`, `npm run typecheck` y `npm run lint` requieren obtener dependencias; registry.npmjs.org no resolvió por DNS y el cache npm no contiene todos los paquetes.
- **Build Docker y prueba de inicio completo:** no hay comando Docker disponible.
- **Integración real con FastAPI/PostgreSQL**, certificados TLS, DNS de academias, autenticación y verificación visual mediante navegador.
- **Comparación pixel-perfect** entre captura y render: no puede afirmarse sin ejecutar la aplicación.

## Checklist obligatorio antes de desplegar

```bash
cp .env.example .env
# Actualizar variables, conexión a FastAPI y DNS/HTTPS de una academia.
npm ci
npm test
npm run typecheck
npm run lint
npm run build
docker compose config
docker compose up -d --build
docker compose ps
curl -i http://127.0.0.1:8080/api/health
```

Luego cargar dos academias reales bajo dos dominios distintos y comprobar que logo, colores, nombre, portada y cursos no se cruzan; verificar el login y el aislamiento de cookie.

**No poner en producción** sin completar estos pasos y resolver cualquier fallo. El paquete está preparado para ejecutarlos, no certifica que hayan pasado en infraestructura real.


## Verificación incremental — Fase 2 (2026-11-16)

- `node --experimental-strip-types --test tests/*.test.mjs`: **13 pruebas aprobadas** (8 existentes de branding/diseño + 5 nuevas sobre política, módulos, rol, CSRF y contratos; son tests unitarios/estáticos, no E2E).
- Inspección de sintaxis TS/TSX: se ejecuta con el parser TypeScript disponible. **No sustituye `npm run typecheck`.**
- `npm ci --offline` falló porque el caché no tenía `zod-validation-error-4.0.2.tgz`; `npm ci` en línea también falló por una excepción del instalador npm. **No se afirma compilación satisfactoria ni Docker validado en este entorno.**
- El equipo ya había compilado y levantado la Fase 1 con Docker; este parche agrega routes y componentes, pero requiere nuevo build y pruebas funcionales contra FastAPI activo.
- Ensayo obligatorio: login sin policies → Llegaste; login con dos policies (HTML/PDF) → wizard; rechazo → logout; aceptación → siguiente; revocación → login; cierre de sesión; expiración; tenant equivocado; dos dominios distintos; flags de módulos; cookies HttpOnly/Secure.

No se modificaron `compose.yaml`, `.env` ni Nginx. Se mantienen los valores que ya funcionan con `host.docker.internal` local. **Bloqueos backend pendientes: refresh/rotación; logins `TEACHER`/`STUDENT` con scope COURSE.**

## Verificación incremental — Fase 3 (2026-11-18)

- `node --experimental-strip-types --test tests/*.test.mjs`: **18 de 18 pruebas aprobadas** (13 anteriores + 5 nuevas sobre roles, vigencia temporal, DTOs, prohibición de métodos de edición/cancelación y acceso a documentos).
- **45 archivos TypeScript/TSX** inspeccionados con el parser/transpilador TypeScript global: cero errores de sintaxis. **No equivale** a `npm run typecheck` con dependencias instaladas.
- `npm ci --no-audit --no-fund --prefer-offline`: no pudo completarse por el entorno sin descarga confiable de paquetes (se agotó la espera). **No** hay build `next build` ni prueba Docker/E2E acreditados.
- Revisión manual del contrato en `app/api/v1/policy_routes.py`, `app/schemas/policy.py`, `app/services/policy_service.py`, `app/services/policy_gate.py` y `app/storage/file_profiles.py` del ZIP FastAPI.
- El ZIP incremental no incluye `.env`, configuración de Nginx, Docker, `node_modules`, `.next` ni código del backend.

**En el equipo local con Docker:** `docker compose up -d --build`, entrar por hostname del business, login ADMIN, gestionar HTML y PDF, visualizar históricas, forzar 428 con nueva política obligatoria, verificar logout y tenant ajeno. Para STUDENT/COURSE, primero resolver el bloqueo de scope en el backend descrito en `MODULO_POLITICAS_FASE3.md`.

## Verificación incremental — Fase 4 (2026-11-19)

- Se reemplazó el componente provisional de `/campus` por una pantalla de Inicio con el `CampusShell` existente, enlaces reales a `/campus/policies` y al catálogo (`/`), detalles de sesión y configuración de módulos obtenidos de FastAPI.
- Tests heredados + pruebas `tests/campus-phase4.test.mjs` sobre eliminación del placeholder, integridad de enlaces, roles/gates y lectura de módulos: **22/22 aprobadas** usando Node 22 (`node --experimental-strip-types --test tests/*.test.mjs`).
- Se comprobó sintaxis de **46 archivos TS/TSX** con parser TypeScript global: **0 errores**. Esto no equivale a `npm run build` ni a pruebas E2E.
- No fue posible instalar todas las dependencias de Next.js desde npm (`npm ci --offline` falló con `ENOTCACHED` para `zod-validation-error-4.0.2.tgz`), ni compilar con Docker. Debe ejecutarse en el entorno del usuario: `docker compose up -d --build`.
- Pruebas manuales: login ADMIN → `/campus` con sidebar, Inicio → Políticas, crear versión y consultar histórico; logout → login; políticas pendientes → wizard antes de entrar; cambio de tenant → sin sesión cruzada; en STUDENT/COURSE, solo después de habilitar su login en FastAPI.
- No se modificaron backend, `.env`, Nginx ni Docker.
