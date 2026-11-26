# Athena — Parche frontend: duplicación de cursos y configuración institucional

**Fecha:** 26/11/2026 · Base: `LMSBasicG-frontend-main.zip`.
**Dependencia:** aplicar primero el backend `Athena_Backend_Patch_Duplicacion_Configuracion_20261126.zip`.
No incluye migraciones, cambios de dependencias, Dockerfile, Compose, secretos ni `.env`.

## 1. Aplicación

Extraer el ZIP directamente en la raíz del repositorio frontend (donde está `package.json`),
aceptando reemplazar los archivos indicados en el manifiesto. No borrar archivos existentes.
Conservar el `.env` y el Compose de producción propios de la VPS. Revisar `git diff` antes de hacer commit.
No se requiere ejecutar el inicializador de PostgreSQL ni modificar el almacenamiento de Contabo.

### Desarrollo directo (Windows)

Con el túnel SSH hacia el backend ya abierto, `.env.local` debe contener `BACKEND_INTERNAL_URL=http://127.0.0.1:9000`.
Ejecutar `npm ci`, `npm test`, `npm run typecheck`, `npm run build` y luego `npm run dev`.
El script `dev` original de este repositorio escucha en **9001**, no en 3000: entrar por `http://localhost:9001`.
Mantener el tenant `localhost`. El nuevo puente de logo en Next.js permite ver el logo también sin Nginx;
no se introdujo un proxy genérico hacia toda la API ni se exponen tokens al navegador.

### Desarrollo con Docker

Conservar `BACKEND_INTERNAL_URL=http://host.docker.internal:9000` y `BACKEND_UPSTREAM=host.docker.internal:9000`.
Tras `docker compose up -d --build`, recrear el proxy para cargar la plantilla modificada:
`docker compose up -d --no-deps --force-recreate proxy`. Acceder por `http://localhost:8080`.

### VPS (después de pruebas en desarrollo y respaldo previo al despliegue)

```bash
cd /srv/athena/projects/frontend
sudo /usr/local/sbin/athena-check-mount
# Solo si el volumen está montado y los cambios ya fueron integrados en la rama de despliegue:
git status --short
git pull --ff-only
sudo docker compose -f docker-compose.production.yml config --quiet
sudo docker compose -f docker-compose.production.yml build frontend
sudo docker compose -f docker-compose.production.yml up -d frontend
sudo docker compose -f docker-compose.production.yml up -d --no-deps --force-recreate proxy
sudo docker compose -f docker-compose.production.yml ps
sudo docker exec athena_frontend_proxy nginx -t
curl -fsS http://127.0.0.1:8080/api/health
```

No cambiar DNS, certificados, puertos ni redes. El Nginx interno conserva la lógica original y amplía
los tiempos de espera para operaciones BFF largas a 300 s. El BFF de duplicación usa 240 s en la petición
mutante, y el de logo 120 s. Comprobar que el Nginx principal mantiene `proxy_read_timeout 300s` y
`proxy_send_timeout 300s` en el snippet de Athena, tal como se propuso en el registro de infraestructura.
Si la configuración real es diferente, adaptar ese timeout y validar con `sudo nginx -t` antes de recargar.
No abrir puertos adicionales. El límite de 100 MiB del proxy interno no se cambia; el logo acepta 10 MiB
más overhead multipart acotado, mientras otros formularios conservan su límite BFF anterior.

## 2. Copiar curso

**Ubicación:** Campus ADMIN → Cursos → acción «Copiar curso» (ícono de copia).
La acción se habilita si la modalidad del curso está permitida por las licencias del tenant.
Modal nativo con foco contenido, nombre de nueva edición y fechas opcionales; las fechas se validan
como calendario y se envía `null` si están vacías. Estado ocupado impide doble envío y cierre accidental.
Se explica qué estructura se conserva y qué información histórica se excluye. La lógica de copia,
licencias, archivos independientes y rollback sigue en el backend; no se reconstruyen los datos en JS.

| BFF | FastAPI | Respuesta |
|---|---|---|
| `POST /api/academic/courses/{id}/duplicate` | `POST /api/v1/courses/{id}/duplicate` | 201 `CourseResponse` |

```json
{"name":"Derecho Laboral - Nueva edición","init_date":null,"finish_date":null}
```

Se valida que el resultado tenga nuevo ID, nombre solicitado, borrador, matrícula cerrada, sin alumnos
ni fecha de publicación. Al confirmar, se navega al aula del nuevo curso para continuar su configuración.
El backend determina el tenant, conserva modalidad y estructura, excluye datos de participantes y no
registra procedencia. No se envía `business_id`, modalidad ni flags de publicación editables.
No hay reintentos automáticos de esta mutación: si llega 5xx, timeout o respuesta inválida, la operación
podría haberse confirmado en el servidor. «Comprobar listado» busca por nombre dentro del tenant actual;
si ya existe un curso homónimo, permite revisarlo, pero la existencia por nombre **no prueba** que esa
petición lo haya creado. Si todavía no aparece, verificar más tarde antes de repetir. No hay un job de fondo
ni API de idempotencia. Los cursos muy grandes pueden superar el timeout aunque el backend siga operando.

## 3. Configuración institucional

**Ubicación:** Campus ADMIN → Administración → Configuración (`/campus/settings`).
El menú y la página están restringidos a ADMIN/PLATFORM; las rutas BFF verifican sesión, políticas,
rol y tenant mediante las utilidades existentes. Las mutaciones verifican mismo origen, tipo de cuerpo,
listas de campos permitidos y tamaño. El JWT se mantiene en la cookie HttpOnly; no se incluye en respuestas.

| BFF | FastAPI | Contrato |
|---|---|---|
| `GET /api/tenant/admin/profile` | `GET /api/v1/tenant/admin/profile` | perfil administrativo |
| `PATCH /api/tenant/admin/profile` | `PATCH /api/v1/tenant/admin/profile` | perfil actualizado |
| `POST /api/tenant/admin/logo` | `POST /api/v1/tenant/admin/logo` | multipart `file`, `{logo_url}` |
| `DELETE /api/tenant/admin/logo` | `DELETE /api/v1/tenant/admin/logo` | 204 |
| `GET /api/v1/tenant/logo?domain=…&v=…` | mismo endpoint | imagen pública (puente Next solo cuando no hay Nginx) |

El GET se valida contra el ID del tenant autenticado y el dominio resuelto. Solo se devuelven los campos
conocidos del perfil/branding a la interfaz; los cambios se aplican por diferencia con el estado inicial.
Las extensiones del JSONB no se envían en PATCH y se conservan en el servidor. No se permite modificar
dominios, licencias, estado o IDs. El correo se valida definitivamente con EmailStr en el backend, por lo que
un dominio reservado puede rechazarse aunque el navegador acepte su sintaxis. Nombre y teléfono siguen
los límites 255/50; nombre de presentación público mantiene el límite preexistente del renderer (100 caracteres).

- **Logo:** seleccionar PNG/JPEG/WebP, hasta 10 MiB; ver preview y guardar por separado o quitar con confirmación.
  MIME/extensión/tamaño se verifican en frontend/BFF y la firma real en backend. Al cambiar logo no se guardan
  accidentalmente los cambios de los formularios de datos y colores.
- **Datos institucionales:** nombre, correo, teléfono. Contactos vacíos equivalen a `null`. Dominios e ID de solo lectura.
- **Identidad visual:** seis claves originales con selector nativo y HEX editable; valores vacíos usan defaults o
  colores derivados. Contraste sugerido 4.5:1, usando el algoritmo existente. Restauración individual o global.
- **Portada pública:** `eyebrow` (70), `title` (120), `description` (300), `cta_text` (38); texto plano.
- **Guardar configuración:** envía solo campos editados. `colors:null` restaura colores y `hero:null` restaura textos;
  los grupos son independientes. «Descartar» solo descarta cambios locales. Una respuesta indeterminada solicita
  volver a consultar antes de otra mutación; errores de validación permiten corregir el formulario.
- **Actualización visual:** invalidación por los dominios del perfil autenticado, incluso ante una respuesta
  ambigua; las solicitudes antiguas en vuelo no repueblan la caché invalidada. `router.refresh()` vuelve a
  resolver el tenant para shell, layout y metadata. Se usa la URL de logo versionada del backend. La caché
  se comparte entre bundles en el mismo proceso Next.js, pero no entre procesos o réplicas; en otros procesos
  el TTL existente es 20 s y el navegador abierto requiere nueva navegación/refresh. No se introduce broadcast.
  El resolver preexistente acepta el dominio de campus y rechaza LANDING; invalidar ambos dominios no significa
  habilitar soporte nuevo de landing. El editor de portada modifica la portada pública existente del campus.

## 4. Verificaciones realizadas y pendientes

Se ejecutó `npm test` (Node 22.16.0, ejecución nativa `--experimental-strip-types`) con **177 pruebas aprobadas,
0 fallidas**, 162 anteriores y 15 nuevas. Las pruebas nuevas ejercitan validadores, fechas, perfil, cambios mínimos,
reset, archivos, logo, contraste y concurrencia de caché; también inspeccionan contratos y cableado de BFF/UI.
No son pruebas de navegador ni un servidor Next.js integrado con FastAPI real.
Se verificaron con TypeScript los módulos puros nuevos y la sintaxis de los archivos TypeScript modificados.
`npm ci` no se completó porque el entorno no pudo resolver `registry.npmjs.org` (`EAI_AGAIN`); no se pudo ejecutar
el typecheck completo del proyecto, el build de Next.js ni pruebas visuales reales. No se accedió a la VPS ni a S3.
Antes de producción ejecutar `npm ci`, `npm run typecheck`, `npm run build`, y las siguientes pruebas manuales
sobre un backend de pruebas (no datos reales):

- ADMIN con MOOC/MDT: copiar un curso con módulos, quizzes, encuestas, deberes, foros, certificados y archivos.
  Comprobar que la copia es borrador, el original no se altera y se excluyen matrículas/asistencias/resultados.
  Cambiar un archivo de la copia y comprobar que el original todavía se descarga. Fechas vacías y nuevas fechas.
- Nombre repetido, modalidad sin licencia, sesión vencida, políticas pendientes, usuario no ADMIN y recurso
  de otro tenant. Verificar que el error no crea un curso ni habilita una operación prohibida.
- Configuración: cambiar nombre/correo/teléfono y guardar; probar campo reservado en petición; editar un solo
  color, restaurar colores, editar/restaurar portada; verificar branding en sidebar, botones, login y portada.
- Subir, reemplazar y quitar logo; validar imágenes incorrectas, tamaños, cache busting y funcionamiento
  tanto con Docker como con `npm run dev`; comprobar que los cambios no afectan el otro tenant.
- Probar los dos dominios públicos con cuentas de prueba distintas (sin compartir cookies), refrescar y
  navegar, verificar aislamiento de las operaciones y los documentos. Revisar móvil, teclado, y contraste.
- Simular fallo de almacenamiento/timeout en ambiente aislado, consultar listado o perfil antes de reintentar.

Este parche no cambia la política de respaldo, no automatiza despliegue, no modifica infraestructura ni
certifica el aislamiento multitenant completo. Mantener las tareas pendientes de infraestructura del registro Athena.
