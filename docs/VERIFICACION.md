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
