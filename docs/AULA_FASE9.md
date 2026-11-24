# Fase 9 — Aula de cursos y Configuraciones (frontend)

Fecha: 20 de noviembre de 2026. Este documento describe el contrato vigente del patch de
frontend y los cambios pendientes del backend, no acredita endpoints que aún no existen.

## Rutas y experiencia

- `/campus/courses/{id}` redirige a `/campus/courses/{id}/modules`.
- `/campus/courses/{id}/modules`: área de trabajo en blanco por decisión de alcance; todavía no se muestran ni modifican módulos, lecciones o bloques.
- `/campus/courses/{id}/settings`: **solo ADMIN**, editor real, con PATCH de curso y, si cambia, PATCH separado del método de calificación.
- `/campus/courses/{id}/{section}`: las demás secciones son placeholders protegidos; no se realizan operaciones que todavía no están migradas.
- La navegación del curso reemplaza la navegación general del campus **solo** para ADMIN y TEACHER que haya superado la autorización en SSR. Para STUDENT se conserva `CampusShell` normal y se muestra una pantalla informativa del aula.

## Orden del menú

| Sección | MOOC ADMIN | MOOC TEACHER | MDT ADMIN | MDT TEACHER |
|---|---|---|---|---|
| Volver (administración / mis cursos) | Sí | Sí | Sí | Sí |
| Módulos | Sí | Sí | Sí | Sí |
| Asistencia (unificada) | Sí | Sí | Sí | Sí |
| Archivos MDT | — | — | Sí | Sí |
| Evidencia MDT | — | — | Sí | Sí |
| Calificaciones | Sí | Sí | Sí | Sí |
| Matrículas | Sí | — | Sí | — |
| Certificados | Sí | — | Sí | — |
| Reportes | — | — | Sí | — |
| Configuraciones | Sí | — | Sí | — |

No se crean opciones distintas para mi asistencia/asistencia estudiantes/asistencia docente.
La visibilidad del menú NO concede permisos: SSR comprueba rol y matrícula; el backend debe volver a verificarlos al ejecutar cualquier operación.

## Autoridad de acceso

- `ADMIN / PLATFORM`: puede abrir cualquier curso del tenant, incluyendo borradores, **sin enrollment**. SSR valida `/api/v1/courses/{id}` usando la sesión del tenant.
- `VISITOR / PLATFORM` con enrollment `ACEPTADO` y rol `TEACHER / COURSE`: puede abrir el espacio docente; no puede abrir secciones administrativas.
- `VISITOR / PLATFORM` con enrollment `ACEPTADO` y rol `STUDENT / COURSE`: no cambia el menú; solo ve un placeholder del aula si el curso está publicado. No se habilitaron módulos académicos.
- `PENDIENTE`, `RECHAZADO`, `CANCELADO` o sin enrollment: 404, no aula. Los cursos de otros tenants tampoco se muestran.
- Siempre se verifica el gate de políticas antes de resolver el acceso al aula.

### Acceso docente implementado en backend Fase 9.1

El backend Fase 9.1 implementa `GET /api/v1/courses/{course_id}/workspace`
para ADMIN o TEACHER con matrícula ACEPTADO del mismo tenant. El frontend
continúa verificando sesión, políticas, enrollment y rol antes de crear el
navbar. El DTO público NO se amplió con MOOC/MDT.

Un docente sin autorización no puede abrir Configuraciones ni ejecutar cambios.
En borradores y con matrícula cerrada el docente aceptado conserva acceso. El
endpoint devuelve únicamente `course_id`, `name` y `course_type.code`.

## Configuraciones ADMIN

El editor reutiliza las clases del formulario y la vista previa de creación: nombre,
descripción, portada, categoría, subcategoría, nivel, moneda, duración, precio,
descuento, lecciones estimadas, fechas, gratuidad, `is_published`,
`open_enrollment` y método de calificación.

1. `PATCH /api/academic/courses/{id}` (BFF ya existente) hacia
   `PATCH /api/v1/courses/{id}` multipart, **sin `course_type_id`**. Se valida
   en BFF que no se incluyan campos arbitrarios, origen CSRF, session tenant,
   políticas y rol ADMIN.
2. Solo si el método cambió se usa
   `PATCH /api/academic/courses/{id}/grade-method`, que transmite a
   `PATCH /api/v1/quiz/courses/{id}/grade-method`; el backend recalcula notas.
3. Son dos transacciones independientes. Si el curso se guardó y falló
   recalcular la calificación, la UI informa **guardado parcial** y permite
   recargar: nunca declara éxito total.
4. El tipo MOOC/MDT permanece **solo lectura dentro del PATCH general**.
   Desde la Fase 9.2, debajo del editor existe un **panel independiente de
   cambio de modalidad**, con vista previa (`/type-preview`) y confirmación
   (`/type-change`). La operación reconfigura bloques, certificados y
   asistencias sin borrar los datos históricos. La licencia del tipo destino
   es obligatoria y las demás modificaciones del formulario deben estar guardadas.
5. `CourseUpdate.as_form` omite multipart vacíos: por ahora FastAPI **no puede
   borrar de forma explícita** un descuento de un curso de pago ni fechas
   previamente establecidas. La UI impide esos casos para evitar confirmaciones
   falsas. Poner `is_free=true` sí borra el descuento a través del servicio.
   Para completar el CRUD en backend se necesita soporte explícito de limpieza
   (por ejemplo, campos de clear dedicados con validación) y su BFF correspondiente.
6. Certificados habilitados y «Próximos apartados del curso» se retiran
   completamente de Configuraciones; sus menús se migrarán en fases posteriores.

## Branding y seguridad

La navegación y el editor utilizan `CampusShell`, `CourseCover`,
`--tenant-sidebar`, `--tenant-primary`, `--tenant-primary-hover`,
`--tenant-on-primary`, `--lms-accent-ink` y clases `lms-course-*`/
`course-settings-*`; no introducen paletas institucionales hardcodeadas.
El backend nunca recibe JWT desde JavaScript del navegador: solo llega al BFF
same-origin o se usa en carga SSR. No guardar tokens en localStorage.

## Verificación de integración

1. ADMIN accede al MOOC/MDT sin matrícula, ve el menú adecuado y Módulos blanco.
2. ADMIN guarda edición de curso/portada/publicación; recarga y verifica los datos
   y el catálogo público del tenant. Cambio de método: comprobar recálculo real.
3. TEACHER con matrícula aceptada y backend 9.1 aplicado,
   ve solo opciones permitidas; si tiene MDT, ve Archivos/Evidencia, no Reportes.
4. TEACHER sin matrícula / con matrícula pendiente no accede ni por URL directa.
5. STUDENT mantiene menú VISITOR; certificado, políticas, catálogo y Mis cursos no cambian.
6. Acceso a `/settings`, `/enrollments`, `/reports`, `/certificates` por TEACHER
   debe regresar 404; probar también cambiando el Host a otro tenant.
7. Ejecutar `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` con
   dependencias instaladas y prueba navegador real en móvil/escritorio.

## Fase 9.2 — Sidebar usable y conversión MOOC/MDT

- El sidebar tiene tres zonas: encabezado fijo, `nav` desplazable y pie de
  cuenta fijo. No hay menú cortado en pantallas de poca altura. Las opciones del
  curso se compactan, y en pantallas muy bajas se omite únicamente el texto de
  ayuda (no las rutas). El enlace activo se desplaza dentro del menú cuando
  está fuera de la región visible. Accesible mediante rueda, tacto y teclado.
- El ADMIN puede abrir «Configuraciones → Cambio de modalidad». El tipo en el
  formulario general continúa de solo lectura; nunca se envía en `CourseUpdate`.
- El panel consulta `/api/academic/course-types` (lista y licencia actual).
  Solo permite seleccionar un código distinto de MOOC/MDT habilitado para el
  tenant. Los IDs se resuelven desde el catálogo, nunca se asumen.
- **Primero** POST a `/api/academic/courses/{id}/type-preview` con
  `{course_type_id}`: FastAPI entrega el plan de bloques, tipos de certificados,
  asistencias y certificados automáticos. Se muestran números y detalles.
- **Después** el usuario marca confirmación expresa. **Solo entonces**
  POST a `/api/academic/courses/{id}/type-change` con
  `{course_type_id,confirm:true}`. El BFF y FastAPI vuelven a validar
  autorización, licencia y tenant. El backend realiza la operación atómica.
- Si existen modificaciones sin guardar del editor general, se bloquea la
  conversión hasta guardar o descartar. Se impide confirmar previews ajenos,
  planes con borrado de datos o tipos distintos al seleccionado.
- Tras éxito, `router.refresh()` actualiza el menú al nuevo MOOC/MDT y el
  estado del editor. Si la respuesta de cambio es incierta, se exige recargar
  y comprobar el tipo antes de reintentar.
- Nada de lo anterior otorga permisos de ADMIN a TEACHER, afecta al navbar
  normal del STUDENT o modifica el esquema de la base de datos.
