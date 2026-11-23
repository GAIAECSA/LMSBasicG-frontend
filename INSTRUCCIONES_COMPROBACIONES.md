# Athena LMS — Comprobación de Modules (22/11/2026)

## 1. Fuentes exactas utilizadas

Se extrajeron los ZIP originales y se superpusieron, por orden, los parches entregados previamente:

1. `Athena-Back-LMS-real-SAAS.zip`
2. `ATHENA_BACKEND_MODULES_PATCH_2026-11-22.zip`
3. `ATHENA_BACKEND_MODULES_COMPAT_2026-11-22.zip`
4. `LMSBasicG-frontend-real-SAAS.zip`
5. `ATHENA_FRONTEND_MODULES_PATCH_2026-11-22.zip`

Las pruebas realizadas después del hotfix adjunto usan los proyectos resultantes de esa composición. No se modificaron los originales adjuntos.

## 2. Resultado verificable

| Verificación | Resultado | Cobertura/observación |
|---|---|---|
| Frontend `npm test` | **PASS, 135/135** | Incluye test nuevo de búsqueda de docentes de curso |
| Backend `python -m pytest -q` | **PASS, 115/115** | Incluye dos pruebas HTTP nuevas de permisos, audiencia y aislamiento entre tenants usando SQLite |
| Backend `python -m compileall -q app migrations` | **PASS** | Compilación sintáctica de código Python |
| Sintaxis TypeScript/TSX | **PASS, 130 archivos, 0 errores sintácticos** | Transpilación con TypeScript disponible localmente, no typecheck semántico |
| Contratos BFF → FastAPI | **PASS, 46 rutas, 56 combinaciones método/ruta** | Comparación de whitelist con registro real FastAPI tras hotfix |
| Alembic | **PASS, generación SQL de revisión 0005** | `alembic upgrade 20261122_0004:20261122_0005 --sql` sobre dialecto PostgreSQL, 70 líneas; sin ejecutar sobre una base real |
| `npm ci --offline` | **BLOQUEADO, ENOTCACHED** | Falta `zod-validation-error` y otros tarballs en caché |
| `npm ci` con registro npm | **BLOQUEADO, EAI_AGAIN** | DNS/red del entorno no resuelve registry.npmjs.org; reintento agotó tiempo |
| `npm run typecheck` | **NO VERIFICADO** | Faltan tipos de React/Node y dependencias (`TS2688`) |
| `npm run lint` | **NO VERIFICADO** | Binario `eslint` no instalado (exit 127) |
| `npm run build` | **NO VERIFICADO** | Binario `next` no instalado (exit 127) |
| E2E Next.js + FastAPI + PostgreSQL | **NO VERIFICADO** | No están disponibles `docker`, `psql` ni servidor PostgreSQL |

**Importante:** 135/115 pruebas aprobadas no equivalen a garantizar que el build de producción pase o que todos los flujos del navegador funcionen. Solo permite afirmar que las pruebas ejecutadas pasan con estos archivos.

## 3. Errores reales detectados y corregidos

### A. Encuestas de audiencia STUDENT no administrables por TEACHER

`GET /api/v1/survey/surveys/{id}` y `GET /api/v1/survey/courses/{id}/surveys` filtraban TEACHER como si fuera participante. Una encuesta `audience=STUDENT` quedaba oculta incluso al profesor con matrícula TEACHER aceptada, aunque sí estaba autorizado a editarla. Ahora ADMIN y TEACHER autorizado pueden leer y administrar todas las audiencias del curso. STUDENT continúa limitado por audiencia y fecha de disponibilidad.

**Archivo:** `app/api/v1/survey_routes.py`.

### B. Revisión de encuestas: imposibilidad de seleccionar otros docentes para transcripción asistida

El frontend BFF consultaba `/api/v1/enrollments/me` cuando el operador era TEACHER; la ruta devuelve únicamente matrículas del operador y no sirve para registrar la respuesta proporcionada por otro profesor. Ahora existe `GET /api/v1/academic-assisted/courses/{course_id}/teachers?search=...`, restringido a instructores reales, curso y tenant, con máximo de 100 coincidencias por consulta y búsqueda por nombre/usuario.

**Archivos:** `app/api/v1/academic_assisted_routes.py`, `app/api/course-modules/[id]/[...resource]/route.ts`, `lib/course-modules/paths.ts`, `components/campus/course-module-review.tsx`.

### C. Verificación de tenant en permiso instructor

`instructor()` aceptaba un rol ADMIN antes de comprobar que `course_id` perteneciera a su tenant. Esto provocaba, por ejemplo, que una consulta directa al nuevo listado de docentes para un curso de otro tenant respondiera HTTP 200 con un array vacío. Se invirtió el orden: primero verificar que el curso existe y pertenece al tenant del JWT, y después evaluar ADMIN o matrícula TEACHER. La prueba nueva exige rechazo para otro tenant. Este cambio endurece también consultas existentes de Homework/Foro y auditoría asistida.

**Archivo:** `app/services/homework_forum_access.py`.

### D. Pruebas añadidas

- `tests/test_modules_verification_hotfix.py` (backend): dos pruebas HTTP sobre encuestas por audiencia y listado de profesores, con intentos de acceso desde STUDENT y un tenant ajeno.
- `tests/course-modules-v2.test.mjs` (frontend): prueba adicional de ruta correcta del listado de docentes y ausencia de dependencia con `/enrollments/me`.

## 4. Instalación de los hotfixes

Los dos ZIP de hotfix contienen exclusivamente archivos agregados/modificados posteriores a los **parches anteriores**. No reemplazan los parches anteriores. No incluyen migrations ni cambian el esquema de base de datos.

1. Sobre el backend que ya tiene los ZIP Modules y compatibilidad, copiar el contenido del nuevo ZIP de hotfix backend respetando las rutas.
2. Sobre el frontend que ya tiene el parche Modules, copiar el nuevo ZIP de hotfix frontend respetando las rutas.
3. Ejecutar en backend `python -m pytest -q` y asegurar que `alembic upgrade head` de la migración original de Modules ya se aplicó en la BD de destino.
4. En Windows PowerShell, con acceso a npm y Node según `package.json`, ejecutar desde la raíz frontend:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

5. Con Docker y PostgreSQL reales levantar servicios en entorno de pruebas y validar manualmente ADMIN y TEACHER de dos tenants (crear 8 recursos en MOOC/MDT, reordenar, cambiar pesos, configurar encuesta solo STUDENT como TEACHER, transcribir encuesta de otro TEACHER, intentar acceso cruzado, descargas privadas ZIP/PDF, Quiz asistido y resultados).

## 5. Limitaciones que persisten

- No se completó instalación npm por DNS/red restringida del entorno; no es correcto declarar aprobado TypeScript semántico, ESLint o `next build`.
- Tampoco hay validación E2E de Next.js + FastAPI + PostgreSQL real; migración SQL offline no sustituye `alembic upgrade head` sobre PostgreSQL.
- La UI del selector de docentes lista hasta 100 por búsqueda y permite buscar por nombre o usuario; para cursos con más de 100 docentes se debe usar búsqueda. Una interfaz de paginación completa sería trabajo posterior.
- Los test actuales del frontend cubren lógica, rutas y contratos estructurales, no automatización real de navegador con interacciones drag and drop.

**Conclusión:** código corregido y regresión local aprobada; despliegue de producción no certificado hasta completar las verificaciones npm y E2E en un entorno con dependencias y PostgreSQL disponibles.
