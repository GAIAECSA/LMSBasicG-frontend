# Athena LMS — Frontend SaaS multi-tenant (fase 2: autenticación y políticas)

Portada **restaurada desde el JSX y los estilos del proyecto LMSBasicG original** (no rediseñada). Un solo Next.js 16 para `academia1.com`, `academia2.com` y `campus.academia3.com`. Nginx preserva el hostname y FastAPI resuelve el `business`. Colores, nombre, logo y portada provienen de la tabla `businesses`, sin compilar ni instalar otro frontend.

## Alcance incluido

- **Portada original recuperada**: mismo encabezado, hero de dos columnas, carrusel destacado, tarjetas informativas y grilla de cursos, con responsive original. Sin «Sobre ATHENA», marca fija ni métricas inventadas.
- Catálogo público del tenant (endpoint actualizado del backend refactorizado).
- Branding mediante `name`, `logo_url` y `branding_config` con variables CSS y validación. **Las clases azul del diseño original se mapean con Tailwind v4** a los colores del tenant, sin recompilar la app.
- Login **sin registro público** por dominio, sesión JWT revocable en FastAPI y cookie HttpOnly host-only.
- Rol `role.code`/`role.scope` y configuración `business_lms_config + lms_configs` recuperados del backend tras completar las políticas.
- Políticas obligatorias en flujo secuencial (`/policies`), lectura HTML/PDF, aceptación individual o logout por rechazo.
- Campus provisional `/campus` con pantalla blanca **«Llegaste»**; no se migran aún los dashboards.
- Aviso informativo de cookies necesarias en `/`; sin cookies opcionales ni analytics.
- Dockerfile optimizado, Docker Compose, Nginx compartido, healthcheck, ejemplo TLS.
- Bitácora de decisiones y contrato del backend en `docs/`.

**No incluye** módulos internos legacy ni el backend. La segunda fase añade el flujo de autenticación/políticas, no el LMS interno completo. **Renovación automática de sesión no implementable sin un endpoint de refresh en FastAPI** (ver `docs/AUTENTICACION_Y_POLITICAS.md`). El monitor comprueba revocación y expiración, no renueva el JWT.

## Puesta en marcha local

```bash
npm ci
cp .env.example .env.local
# Editar BACKEND_INTERNAL_URL para que Next.js alcance FastAPI.
npm run dev
```

Abre un dominio que **exista** en `businesses.tenant_domain` apuntándolo mediante `hosts` a `127.0.0.1`, por ejemplo `campus.academia.test:9001`. Sin proxy, las rutas `/api/v1/*` del navegador no se reenviarán: para login/logos usa el flujo Docker/Nginx o crea un reverse proxy local.

## Puesta en marcha Docker

```bash
cp .env.example .env
# Ajustar BACKEND_INTERNAL_URL y BACKEND_UPSTREAM
# El backend debe ser accesible desde la red Docker; ver docs/DESPLIEGUE.md.
docker compose up -d --build
curl -i http://127.0.0.1:8080/api/health
```

El puerto de entrada está restringido a loopback. Exponer varios dominios mediante Nginx/Caddy TLS en el host, con proxy hacia `127.0.0.1:8080` y conservando `Host`.

## Instalación incremental de Fase 2

Si ya tienes la Fase 1 restaurada, **extrae el ZIP de cambios directamente en la raíz del frontend, sobrescribiendo archivos con el mismo nombre**. No reemplaces `.env`, `compose.yaml`, Dockerfile, componentes de portada ni otros módulos: no están en el ZIP de esta fase. Consulta `docs/AUTENTICACION_Y_POLITICAS.md`.

## Mantenimiento de la apariencia original

El diseño restaurado vive en `components/public/home-client.tsx`, migrado desde `components/courses/public-courses-view.tsx` del ZIP original. Los breakpoints originales también están conservados. Los matices institucionales se configuran en `lib/tenant/branding.ts` y `app/globals.css`, no cambiando clases de cada academia. Consulta `docs/DISENO_Y_BRANDING.md` y la bitácora.

## Desarrollo y pruebas

```bash
npm run typecheck
npm run lint
npm run build
```

## Arquitectura

```text
Dominios de academias (mismo servidor)
    → Nginx TLS público
    → Nginx Docker 127.0.0.1:8080
       ├── /api/v1/ y /uploads/ → FastAPI existente (SIN CAMBIOS)
       └── demás rutas → Next.js standalone :9001
          ├── Resolve tenant (SSR, host original, cache por petición)
          ├── Branding CSS + metadata (SSR)
          ├── Catálogo público (SSR, tenant_domain)
          ├── /api/auth/* (BFF; cookie host-only HttpOnly)
          ├── /api/policies/* (BFF HTML/PDF y aceptación)
          └── /campus (solo Llegaste, datos/rol/módulos validados en SSR)
```

Detalles: [Bitácora de arquitectura](docs/DECISIONES_Y_CAMBIOS.md) · [Despliegue](docs/DESPLIEGUE.md) · [Contrato del backend](docs/CONTRATO_BACKEND.md) · [Verificación](docs/VERIFICACION.md).


**Pendiente en backend, sin cambios aquí:** endpoint de refresh/rotación de tokens y revisión de roles COURSE en login. Ver contrato y bitácora.
