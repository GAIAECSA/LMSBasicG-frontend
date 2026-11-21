# Fase 12.1 — Integración frontend con los lotes atómicos de FastAPI (20-11-2026)

## Base de instalación

Se aplica **después** de frontend fase 11 y backend fase 12. Es un parche incremental: no reemplazar rutas, estilos, modelos ni componentes de fases anteriores. No requiere migración SQL, nuevos paquetes npm ni cambios a `package-lock.json`. En backend sí debe haber sido ejecutada la migración Alembic de fase 12.

## Contratos utilizados

Todas las peticiones pasan por `/api/course-workspace/[id]/[...resource]` en Next.js con cookie de sesión HTTP-only, verificación del workspace, tenant y HTTP 428 por políticas. La autorización real sigue en FastAPI. No se envían `business_id` ni `role_id` desde el navegador.

| Operación del frontend | Proxy autenticado | FastAPI destino |
|---|---|---|
| Buscar candidatos (ADMIN) | GET `/enrollments/users?q=&page=1&page_size=25` | GET `/api/v1/users/search?q=&page=1&page_size=25&active_only=true&role_code=VISITOR` |
| Matricular existentes (ADMIN) | POST `/enrollments/bulk` | POST `/api/v1/enrollments/admin/bulk` |
| Importar Excel/manual (ADMIN) | POST `/enrollments/massive` | POST `/api/v1/enrollments/massive` |
| Previsualizar asistencia (ADMIN/TEACHER) | POST `/attendance/recurring/preview` | POST `/api/v1/course_attendance/course-attendance/recurring/preview` |
| Crear asistencia (ADMIN/TEACHER) | POST `/attendance/recurring` | POST `/api/v1/course_attendance/course-attendance/recurring` |

El JSON se valida de nuevo en el BFF (hasta 300 filas) y luego en FastAPI. El límite del BFF sube a **350 KB solamente** para los dos endpoints de matrícula por lote; las demás operaciones conservan 8 KB. La búsqueda no carga toda la tabla `users` del tenant; mantiene selección entre páginas y devuelve solo VISITOR activos.

## Matrícula masiva: identidad por cédula

- Se continúa leyendo `.xlsx` en el navegador con la plantilla española existente. Solo se envía JSON al backend, no archivos Excel.
- Se exige cédula para cada fila de la nueva interfaz; se conservan ceros iniciales al importarla como texto. Se detectan cédulas repetidas dentro del archivo antes de enviar. El máximo es **300 personas** (sin truncamiento silencioso).
- **El frontend NO busca usuarios por username, email o nombre para determinar identidades**, no crea usuarios por separado y NO obliga a rellenar los demás campos de una fila con cédula existente.
- FastAPI busca por `idnumber_hash` de ese tenant. Si la cuenta existe y está activa, ignora el resto del Excel **aunque esté vacío o incorrecto** y solo matricula; si no existe, valida los campos, crea VISITOR y provisiona matrícula/asistencia/certificado en una única transacción.
- El rol por fila es `STUDENT` o `TEACHER`; `STUDENT` predeterminado. Si ya existe matrícula ACEPTADO, FastAPI la omite y conserva su rol. El cambio de rol sigue siendo una acción explícita.
- HTTP 409 (fila inválida) significa **rollback completo**, NO una carga parcial. Un error de red no confirma rollback: revisar el listado antes de reintentar. No se reenvían filas automáticamente.
- La interfaz elimina contraseñas temporales del estado React después de un éxito; nunca se escriben en logs.

## Asistencia recurrente

- El formulario conserva días visuales en orden lunes-domingo (índices JavaScript: domingo 0). El DTO usa los índices **Python** (`lunes=0`, ..., `domingo=6`) mediante `jsDayToPython`.
- Se usan las mismas fechas locales de la UI (`AAAA-MM-DD`), sin convertir a UTC local ni alterar el día.
- La vista previa local solo valida el formulario; la vista previa autoritativa la devuelve FastAPI con `total_generated`, `to_create`, `existing` y `excluded`.
- No se permite crear mientras no exista una vista previa vigente para la configuración actual. Cambiar un campo invalida automáticamente la anterior. Antes de confirmar, se muestra el número de sesiones nuevas.
- `skip_existing=true` omite sesiones activas idénticas. El POST crea todas las sesiones y sus asistencias PENDIENTE de STUDENT y TEACHER aceptados **en una transacción**; no hay bucles de POST individuales.
- Se mantiene la edición individual, archivado de sesiones y cambio de estados de asistencia existentes sin modificar sus rutas.

## Permisos, branding y compatibilidad

- ADMIN gestiona matrículas y asistencia sin matrícula propia; TEACHER aceptado gestiona asistencia; STUDENT no recibe estos controles.
- Se conservan los tokens de branding CSS `--tenant-primary` y todas las rutas anteriores del aula.
- La lógica histórica `matchKnownUser` / `personError` permanece en el módulo de utilidades para compatibilidad con pruebas anteriores, pero **el nuevo flujo de importación NO la invoca**: sería contraria al criterio definitivo de cédula prioritaria.
- El backend de fase 12 debe estar desplegado antes que este frontend. Si no, los nuevos endpoints devolverán 404.

## Validación

Ejecutar `npm test`, `npm run typecheck`, `npm run build` y después `docker compose up -d --build`. Las pruebas incluidas ejercitan el contrato serializado, la conversión de días y la presencia de endpoints y reglas de seguridad. Se recomienda verificar con PostgreSQL de staging una matrícula masiva mixta (cédula existente y nueva), una fila inválida para comprobar rollback, y programación recurrente con más de una matrícula aceptada.
