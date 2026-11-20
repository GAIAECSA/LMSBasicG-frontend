# Athena LMS — Frontend SaaS multi-tenant (Fase 7: VISITOR + gestión ADMIN)

Portada **restaurada desde el JSX y los estilos del proyecto LMSBasicG original** (no rediseñada). Un solo Next.js 16 para `academia1.com`, `academia2.com` y `campus.academia3.com`. Nginx preserva el hostname y FastAPI resuelve el `business`. Colores, nombre, logo y portada provienen de la tabla `businesses`, sin compilar ni instalar otro frontend.

## Alcance incluido

- **Portada original recuperada**: mismo encabezado, hero de dos columnas, carrusel destacado, tarjetas informativas y grilla de cursos, con responsive original. Sin «Sobre ATHENA», marca fija ni métricas inventadas.
- Catálogo público del tenant (endpoint actualizado del backend refactorizado).
- Branding mediante `name`, `logo_url` y `branding_config` con variables CSS y validación. **Las clases azul del diseño original se mapean con Tailwind v4** a los colores del tenant, sin recompilar la app.
- Login **sin registro público** por dominio, sesión JWT revocable en FastAPI y cookie HttpOnly host-only.
- Rol `role.code`/`role.scope` y configuración `business_lms_config + lms_configs` recuperados del backend tras completar las políticas.
- Políticas obligatorias en flujo secuencial (`/policies`), lectura HTML/PDF, aceptación individual o logout por rechazo.
- **Campus ADMIN** `/campus`: inicio, shell lateral, usuarios, categorías, subcategorías, cursos y políticas.
- **Campus VISITOR**: tras login y políticas va directamente a `/campus/my-courses`, con matrículas aceptadas de cursos publicados, roles STUDENT/TEACHER y progreso de bloques STUDENT; catálogo interno de lectura `/campus/catalog` y apartado informativo `/campus/certificates`. Aún no hay autoinscripción, aula ni certificados funcionales.
- Aviso informativo de cookies necesarias en `/`; sin cookies opcionales ni analytics.
- Dockerfile optimizado, Docker Compose, Nginx compartido, healthcheck, ejemplo TLS.
- Bitácora de decisiones y contrato del backend en `docs/`.

**No incluye** módulos internos legacy que aún no hayan sido migrados ni modifica el backend. Las fases siguientes irán incorporando aula, matrícula del visitante y certificados. **Renovación automática de sesión no implementable sin un endpoint de refresh en FastAPI** (ver `docs/AUTENTICACION_Y_POLITICAS.md`). El monitor comprueba revocación y expiración, no renueva el JWT.

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
          ├── /campus (inicio real con shell, cuenta y módulos provenientes del backend)
          └── /campus/policies (gestión ADMIN o consulta de políticas por rol)
```

Detalles: [Bitácora de arquitectura](docs/DECISIONES_Y_CAMBIOS.md) · [Despliegue](docs/DESPLIEGUE.md) · [Contrato del backend](docs/CONTRATO_BACKEND.md) · [Verificación](docs/VERIFICACION.md).


**Pendiente en backend, sin cambios aquí:** endpoint de refresh/rotación de tokens y revisión de roles COURSE en login. Ver contrato y bitácora.

## Fase 3 — Políticas del campus

- `/campus` conserva «Llegaste» con barra lateral reutilizable y nombre/logo del tenant.
- `/campus/policies`: **Administración → Políticas** para ADMIN/PLATFORM, con alta de políticas CLIENT, publicación HTML/PDF, versión vigente e historial de solo lectura. **Información → Políticas** para usuarios no ADMIN (vigentes obligatorias/informativas ATHENA y CLIENT, más últimas aceptaciones históricas).
- Se mantiene el wizard obligatorio `/policies` de Fase 2; al publicar una nueva versión obligatoria, el usuario debe aceptarla antes de continuar.
- Instrucciones, justificación por archivo y necesidades backend: [`docs/MODULO_POLITICAS_FASE3.md`](docs/MODULO_POLITICAS_FASE3.md). Inventario de sobrescritura: [`docs/INVENTARIO_PATCH_FASE3.md`](docs/INVENTARIO_PATCH_FASE3.md).

## Fase 4 — Inicio operativo del campus (2026-11-19)

Después de las credenciales y de completar el wizard obligatorio de políticas, la aplicación entra en `/campus`, **sin la tarjeta «Hola, Admin» ni el placeholder «Llegaste»**. Un único `CampusShell` permite navegar a Inicio y a **Administración → Políticas** (ADMIN/PLATFORM), o **Información → Políticas** (resto de roles autorizados). El botón de cuenta permite cerrar sesión.

`CampusHome` presenta exclusivamente datos recuperados de FastAPI durante `authState()` y enlaces a funcionalidades que ya están disponibles; los demás botones del menú siguen deshabilitados hasta migrar esos módulos. Los colores del tenant aparecen como acentos sobre superficies neutras.

**Instalación incremental:** superponer el ZIP de Fase 4 en la raíz del frontend actual (previamente actualizado con las Fases 2 y 3). Conservar `.env`, `compose.yaml`, `Dockerfile` y Nginx sin cambios. Ejecutar `docker compose up -d --build` y verificar `/campus` y `/campus/policies`.

Detalle de cambios, justificación y pruebas: [Inicio del campus](docs/INICIO_CAMPUS_FASE4.md) · [Inventario del parche](docs/INVENTARIO_PATCH_FASE4.md) · [Bitácora](docs/DECISIONES_Y_CAMBIOS.md).


### Parche de recuperación del Home (19/11/2026)
Este ZIP consolida Fases 2, 3 y 4 para eliminar la tarjeta provisional de la Fase 1. Tras sobrescribir los archivos en la raíz del frontend, ejecuta `powershell -ExecutionPolicy Bypass -File .\VERIFICAR_Y_RECONSTRUIR.ps1`. Consulta `docs/RECUPERACION_HOME_FASE4.md`.

## Fase 6 — Cursos

La gestión administrativa de **Categorías, Subcategorías y Cursos** y el detalle `/campus/courses/{id}` están documentados en `docs/MODULO_CURSOS_FASE6.md`.

Antes de crear cursos, comprueba la correspondencia exacta entre `lms_configs.code` y `ATHENA_LMS_MOOC_CODE` / `ATHENA_LMS_MDT_CODE`. **FastAPI necesita aplicar también la validación de licencia en creación y transición**; el BFF no sustituye ese control.


## Fase 7 — VISITOR: navegación y cursos (2026-11-20)

El acceso VISITOR se dirige a **Mis cursos** (sin opción «Inicio»). La información procede de `GET /enrollments/me` y del catálogo público del tenant; solo se muestran matrículas `ACEPTADO` de cursos publicados, incluso si la matrícula pública ya está cerrada. En cada tarjeta se presenta rol académico; para STUDENT se intenta calcular porcentaje de bloques activos completados mediante la API existente. Si no puede calcularse, se muestra «Progreso aún no disponible»; para TEACHER, «No aplica». **No es una nota ni cálculo de certificados**.

La opción **Cursos** muestra todas las publicaciones de la academia, independientemente de `open_enrollment`, con filtros, portadas y precios, pero sin autoinscripción. **Certificados** se conserva como página informativa hasta migrar el módulo. ADMIN mantiene sus rutas y menú anteriores. El frontend utiliza los tokens de `branding_config` del tenant y el BFF/cookies existentes; no añade dependencia nueva ni cambia FastAPI.

Consulta [Guía de VISITOR Fase 7](docs/VISITOR_FASE7.md), [Diseño y branding](docs/DISENO_Y_BRANDING.md) y [Decisiones](docs/DECISIONES_Y_CAMBIOS.md). Para instalar: superponer el ZIP de esta fase en la raíz del frontend, ejecutar `npm test && npm run typecheck && npm run lint && npm run build`, reconstruir y validar en tu entorno con PostgreSQL y datos reales. El cálculo de progreso por múltiples consultas debe reemplazarse en una siguiente fase por un endpoint agregado del backend.
