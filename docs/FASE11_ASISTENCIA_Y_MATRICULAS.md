# Fase 11 — Asistencias y Matrículas (frontend)

## Base y contratos

Aplicar sobre `LMSBasicG-frontend-real-SAAS` con fases 7, 8.1, 9, 9.1 (backend) y 9.2 (frontend). El backend utilizado para cotejar el contrato es la fase 10 (asistencia MOOC/MDT y provisioning bidireccional).

Rutas del aula: `/campus/courses/{id}/attendance` y `/campus/courses/{id}/enrollments`. El servidor Next.js verifica sesión, políticas y `getCourseWorkspace` en cada llamada; FastAPI vuelve a autorizar tenant, curso y rol. ADMIN puede operar ambos; TEACHER matriculado y ACEPTADO gestiona asistencia; STUDENT conserva su navegación sin acceso a estos módulos.

## Asistencia

- Crear sesión: `POST /api/v1/course-attendance`, `{course_id,day,start_time,end_time}`.
- Listar: `GET /api/v1/course-attendance/course/{course_id}`.
- Actualizar: `PUT /api/v1/course-attendance/{attendance_id}`.
- Archivar: `DELETE /api/v1/course-attendance/{attendance_id}`; se preservan registros históricos.
- Leer participantes: `GET /api/v1/attendance/course-attendance/{session_id}`.
- Actualizar estado: `PUT /api/v1/attendance/{attendance_id}`, solo `attendance_state`.
- Estados: `PENDIENTE`, `PRESENTE`, `AUSENTE`, `ATRASADO`, `JUSTIFICADO`.

El calendario semanal del frontend permite seleccionar uno o varios días, horarios distintos por día, período e incluir excepciones (fechas sin clase). `schedulePreview` no crea sesiones; las enumera localmente, valida límites y excluye coincidencias exactas con las ya existentes. La creación real se realiza **una sesión por POST**: FastAPI fase 10 no ofrece `bulk` o transacción para múltiples sesiones. Si falla una petición, las sesiones previas permanecen confirmadas y debe revisarse el calendario. La consulta inicial y la vista previa reducen duplicaciones en reintentos; **no previenen carreras entre administradores**. Para una garantía de unicidad y creación atómica se necesita un endpoint de FastAPI y, eventualmente, un índice de unicidad en BD. No usar el frontend como autoridad de calendario.

El rol de cada fila se obtiene de `enrollments` (ADMIN) o la referencia de rol del propio TEACHER (`enrollments/me`); el contrato actual de `AttendanceWithEnrollmentResponse` no devuelve `role.code`. Si una referencia no es verificable, la vista muestra «Por identificar» en lugar de inventar el rol.

## Matrículas

- Listar: `GET /api/v1/enrollments?course_id={id}` (solo ADMIN).
- Crear/reactivar una: `POST /api/v1/enrollments/admin`, `{course_id,user_id,role_code}`.
- Aceptar/rechazar/cancelar: `POST /api/v1/enrollments/{id}/{accept|reject|cancel}`.
- Cambiar rol: `PATCH /api/v1/enrollments/{id}/role`, `{role_code}`.
- Cargar usuarios ya existentes: `/api/users` de la base anterior.
- Crear usuario nuevo: `POST /api/users` con `role_code:VISITOR`, luego matricular por endpoint administrativo. **Nunca** enviar `role_code:TEACHER` a `/users`; es un rol de curso.

La pantalla permite seleccionar varios usuarios existentes con búsqueda, establecer un rol común, revisar matrículas, reactivar pendientes y cambiar rol en matrículas aceptadas. En la vista masiva se pueden agregar filas manualmente o leer la hoja `Estudiantes` de `public/plantilla_matricula_es.xlsx` (columnas en español: Usuario, Contraseña, Nombres, Apellidos, Cédula, Correo, Teléfono, Provincia, Rol). Rol por fila acepta Estudiante/Profesor, predeterminado STUDENT. La contraseña es obligatoria **solo al crear una cuenta nueva**; mínimo ocho caracteres.

**Identidad:** Nunca asociar usuario por username sin verificar también nombres, apellidos, cédula y correo; si hay conflicto, requiere corrección administrativa. Se rechazan duplicados dentro del archivo. Un usuario ya matriculado ACEPTADO se omite y su rol no se cambia silenciosamente. El provisioning de asistencia de sesiones antiguas lo hace el backend al crear/reactivar matrícula.

**Límite de la fase:** FastAPI `/enrollments/massive` solo admite STUDENT y su manejo de coincidencias es distinto al deseado. Por ello este frontend NO lo utiliza para carga mixta: procesa una fila a la vez (crear usuario si falta + matrícula administrativa), máximo 100 filas por carga. Esto permite roles por fila sin cambiar FastAPI, pero **no ofrece atomicidad global ni rendimiento óptimo en lotes grandes**. Si la creación del usuario se completa pero falla la matrícula, se reporta la cuenta generada y debe revisarse antes de reintentar. No son transacciones distribuidas. Las credenciales se eliminan del estado del formulario después de ejecutar el lote. La importación XLSX solo lee datos y nunca ejecuta macros, vínculos o fórmulas. Mantener cédula/teléfono como texto para preservar ceros iniciales.

## Próxima optimización recomendable en FastAPI

1. Generación recurrente transaccional con previsualización y validación concurrente de sesiones duplicadas.
2. Matrícula administrativa por lote con rol por fila, validación de identidad por tenant y estados individualizados; evitar dos transacciones separadas para crear usuario y matricular.
3. Búsqueda paginada de usuarios por nombre, cédula, usuario y correo (`GET /users` actual carga la lista del tenant entera).
4. DTO de asistencia con `role.code` directamente para evitar consulta adicional para identificar docentes/estudiantes.

No se ha modificado ni es necesario modificar el DTO público MOOC/MDT. Los colores institucionales se expresan mediante los tokens CSS (`--tenant-primary`, `--tenant-primary-tint`, `--tenant-on-primary`) y respetan el branding del tenant.
