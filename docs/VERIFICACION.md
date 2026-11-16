# Verificaciones de la fase 1

Fecha: 2026-11-16.

## Verificado aquí

- **4 pruebas unitarias aprobadas** (`npm test`): normalización de hostname, aislamiento entre academias, fallbacks seguros de branding y ruta de logo limitada al tenant.
- **22 archivos TypeScript/TSX** inspeccionados con `typescript.transpileModule`: sin errores sintácticos.
- **Lockfile reconciliado** con `package.json` vía `npm install --package-lock-only --offline`.
- **Docker Compose/Nginx** revisados estáticamente: Nginx preserva Host y X-Forwarded-Proto, API FastAPI en `/api/v1`, Next.js para páginas y BFF en `/api/auth`.
- El proyecto no incluye `node_modules`, `.next`, el backend ni imágenes legadas de ATHENA.

## No verificado en este entorno (requiere infraestructura)

- No fue posible ejecutar `npm ci` / `npm run build` / `npm run typecheck`/`npm run lint` de extremo a extremo por falta de acceso DNS al registro npm; no se afirma una compilación exitosa. Ejecutar en entorno con red antes del despliegue.
- No se pudo construir la imagen Docker ni ejecutar `nginx -t`: Docker y Nginx no están instalados en esta instancia de trabajo.
- No se realizó una prueba de punta a punta contra PostgreSQL/FastAPI activos: los ZIP contienen el código, no una base de datos con tenants ni servidores de prueba.

## Procedimiento de aceptación obligatorio en VPS

```bash
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

Después, validar dos dominios y dos cuentas distintas según `docs/DESPLIEGUE.md`. Si alguno de esos pasos falla, corregir antes de poner en producción.
