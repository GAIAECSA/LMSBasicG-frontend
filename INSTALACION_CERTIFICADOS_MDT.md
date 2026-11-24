# Parche incremental Athena — Certificado institucional opcional MDT

**Alcance**: frontend ADMIN únicamente, curso MDT. Base: frontend refactorizado y parches de Certificados hasta los fixes de pestañas TypeScript y validadores de `unknown` (22/11/2026).

## Instalación Windows

1. Realiza un respaldo o commit de tu frontend y revisa tus cambios locales antes de sobrescribir.
2. Extrae el ZIP en `C:\proyectosPersonales\LMSBasicG-frontend`, conservando las rutas.
3. Ejecuta desde esa carpeta:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

4. Si el build pasa, reconstruye la imagen del frontend:

```powershell
docker compose up -d --build
```

El backend no cambia, y no se requiere Alembic. El backend debe tener los endpoints existentes `GET /api/v1/courses/{id}`, `GET /api/v1/course-types/{id}` y `PUT /api/v1/courses/{id}/certificate-types`.

## Uso

- ADMIN → Curso MDT → **Configuraciones** → **Certificados del curso** → habilitar `Certificado institucional adicional` → **Guardar certificados**.
- ADMIN → Curso MDT → **Certificados** → **Por estudiante**: dos columnas independientes (MDT e Institucional), con vista previa privada y enlaces a gestión individual. Las pestañas MDT e Institucional conservan importación masiva, PDF por estudiante, corrección e historial.
- Al desactivar el institucional, la pestaña y la columna conjunta dejan de mostrarse. Los archivos anteriores no se borran; reactivarlo permite seguir utilizándolos.
- En MOOC no aparece el nuevo control. La capacidad `AUTOMATIC` opcional en MDT no se cambia ni se activa para generación.

## Seguridad y contratos

El BFF `GET/PUT /api/academic/courses/{id}/certificate-types` exige ADMIN, aplica origen único para PUT, consulta reglas actuales y envía a FastAPI **la lista completa de tipos**. Conserva MDT y AUTOMATIC activos; no confía en IDs enviados por navegador ni admite un `business_id` cliente.

La vista conjunta consulta las dos listas existentes por matrícula aceptada y se vincula por `enrollment_id`, no por orden posicional. Las operaciones y PDFs siguen pasando por BFF privado.

## Archivos a AGREGAR

- `app/api/academic/courses/[id]/certificate-types/route.ts`
- `lib/course-workspace/certificate-settings.ts`
- `components/campus/course-certificate-settings.tsx`
- `components/campus/course-certificate-settings.module.css`
- `components/campus/certificate-mdt-overview.tsx`
- `tests/course-certificate-configuration.test.mjs`
- `docs/CERTIFICADOS_MDT_DOBLE_DOCUMENTO_20261122.md`

## Archivos a REEMPLAZAR

- `components/campus/admin-course-detail.tsx`
- `components/campus/course-certificates.tsx`
- `components/campus/certificate-external-manager.tsx`
- `components/campus/course-certificates.module.css`
- `tests/certificate-tabs-typing.test.mjs`
- `docs/DISENO_Y_BRANDING.md`
- `docs/DECISIONES_Y_CAMBIOS.md`
- `README.md`

## Comprobaciones realizadas

- 127/127 pruebas con `npm test` sobre el frontend reconstruido con los parches anteriores.
- Tipado estricto aislado (`tsc`) del módulo `lib/course-workspace/certificate-settings.ts`.
- Validación sintáctica TypeScript/TSX para los siete archivos de código TS/TSX que se añaden o modifican.
- **Pendiente**: `npm run typecheck`, `npm run lint`, `npm run build` completos y prueba HTTP con tu FastAPI/PostgreSQL; la instalación de dependencias se bloqueó en el entorno de validación. No se presenta el build como aprobado.
