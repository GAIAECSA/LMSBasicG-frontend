# Fase 12.2 — Corrección de contratos de Asistencia (Frontend)

## Motivo

El frontend de la fase 12.1 llamaba a la ruta de Next.js
`GET /api/course-workspace/{id}/attendance`, pero el BFF reenviaba a FastAPI
`/api/v1/course-attendance/course/{id}`. Ese prefijo **no existe** en el backend
actual y respondía 404. Los POST/PUT/DELETE de asistencia individual tenían el
mismo error, mientras que los dos POST recurrentes ya usaban el prefijo correcto.

## Endpoints comprobados directamente en el backend vigente

FastAPI monta `app.api.v1.course_attendance_routes` en `/api/v1/course_attendance`
y `app.api.v1.attendance_routes` en `/api/v1/attendance`.

| BFF Next.js | FastAPI | Método |
|---|---|---|
| `/api/course-workspace/{course}/attendance` | `/api/v1/course_attendance/course-attendance/course/{course}` | GET |
| `/api/course-workspace/{course}/attendance/{session}` (comprobación) | `/api/v1/course_attendance/course-attendance/{session}` | GET |
| `/api/course-workspace/{course}/attendance` | `/api/v1/course_attendance/course-attendance` | POST |
| `/api/course-workspace/{course}/attendance/{session}` | `/api/v1/course_attendance/course-attendance/{session}` | PUT / DELETE |
| `/api/course-workspace/{course}/attendance/{session}/records` | `/api/v1/attendance/attendance/course-attendance/{session}` | GET |
| `/api/course-workspace/{course}/attendance/{session}/records/{attendance}` | `/api/v1/attendance/attendance/{attendance}` | GET previo de propiedad + PUT |
| `/api/course-workspace/{course}/attendance/recurring/preview` | `/api/v1/course_attendance/course-attendance/recurring/preview` | POST |
| `/api/course-workspace/{course}/attendance/recurring` | `/api/v1/course_attendance/course-attendance/recurring` | POST |

Las rutas de FastAPI están centralizadas en `lib/course-workspace/attendance-api.ts`.
Solo el BFF maneja el JWT mediante cookie httpOnly y comprueba workspace, rol y curso
antes de consultar o modificar información privada. La lista de asistentes nunca
se habilita directamente para STUDENT.

## Identificación del rol en la tabla

Para ADMIN se cruza el listado de asistentes con `GET /enrollments/` del curso.
Para TEACHER se utiliza `GET /enrollments/me` (no tiene acceso administrativo).
El contrato backend permite exclusivamente `STUDENT`/`TEACHER` como roles de matrícula;
por ello, si está confirmada la matrícula propia TEACHER aceptada en el curso,
se identifica a otros docentes por `role_id` y a los participantes de otro rol
como STUDENT. Si falta esa evidencia, se devuelve `null` en vez de inventar.

**Mejora posterior opcional:** añadir `role.code` a `AttendanceWithEnrollmentResponse`
para eliminar la consulta auxiliar de matrículas y simplificar filtros sin inferencias.
No forma parte del patch y no cambia el DTO público de cursos.

## Qué NO se modificó

Matrículas (búsqueda, Excel y lotes), API de autenticación/sesión, estilos y
variables de branding por tenant, vistas, navegación, tablas ni backend.
El error independiente `500 /api/auth/session` solo puede diagnosticarse con los
logs del servidor Next.js; este patch corrige las rutas 404 de Asistencia.

## Validación y despliegue

1. Extraer el ZIP en la raíz del frontend limpio con las fases 11 y 12.1 aplicadas.
2. Ejecutar `npm test`, `npm run typecheck`, `npm run build`.
3. Reconstruir imagen: `docker compose up -d --build`.
4. Verificar en curso MOOC y MDT, como ADMIN y TEACHER: listado, crear sesión,
   vista previa recurrente, crear lote, registros, editar horario, cambiar estado y archivar.
5. Si persiste `500 /api/auth/session`, revisar `docker compose logs --tail=150 frontend`.
