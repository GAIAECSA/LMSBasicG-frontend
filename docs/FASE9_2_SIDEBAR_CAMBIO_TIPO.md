# Fase 9.2 — Sidebar accesible y cambio de tipo MOOC/MDT

**Fecha:** 20-11-2026. **Repositorio:** frontend limpio de Athena, sobre las fases 7, 8.1, 9 y fix TypeScript. No se incluye el backend.

## Qué se arregló

1. Sidebar del curso con menú desplazable, compactado, pie de cuenta y marca permanentes. Los enlaces siguen siendo los mismos y conservan las restricciones ADMIN/TEACHER.
2. En Configuraciones, por debajo del formulario general, se incorpora la tarjeta de cambio de modalidad. La opción «Tipo de curso» del editor general sigue en modo lectura y enlaza al nuevo panel; no cambia tipo en un PATCH genérico.

## Flujo de conversión

- Solo ADMIN puede acceder a esta pantalla en SSR y mediante el BFF.
- Consulta `GET /api/academic/course-types` para obtener tipos por ID **real** y `allowed` por código. Si falta la capacidad de destino, no se puede iniciar una conversión.
- Con campos sin guardar en el editor general, la tarjeta no permite previsualizar ni confirmar; el usuario debe guardar o descartar primero.
- El ADMIN elige el destino y pulsa «Ver cambios antes de confirmar».
- `POST /api/academic/courses/{id}/type-preview`: `{ "course_type_id": <id> }`. Devuelve bloques a crear, reactivar, desactivar y conservar; tipos de certificados, asistencias y certificados automáticos. Ningún dato se elimina en el contrato actual.
- La UI muestra el resumen y, al desplegar, los elementos específicos y si los bloques contienen datos históricos. Un plan que declara eliminación de datos es rechazado por precaución.
- Solo tras marcar el consentimiento, `POST /api/academic/courses/{id}/type-change`: `{ "course_type_id": <id>, "confirm": true }`.
- El servidor vuelve a comprobar licencia, rol, tenant y el plan más reciente. Si se confirma el curso devuelto y coincide tipo/ID, la UI hace `router.refresh()`, actualizando navbar y tipo del editor.
- Si la respuesta es incierta, se informa al ADMIN que recargue para verificar la modalidad; no se afirma que el cambio ocurrió.

## Qué se conserva

- Las otras ediciones del curso y el endpoint de método de calificación no se modifican.
- Las rutas de docente, estudiante, VISITOR, imágenes, certificados, menús MOOC/MDT, diseño por tenant y servicios de matrícula no se alteran.
- No se modifica el backend ni la estructura de base de datos. Se utilizan endpoints que ya existen en el backend refactorizado y en el frontend actual.
- El estado `course_type.code` continúa siendo fuente de verdad para el menú. No asumir `course_type_id=1` ni valores de plan por nombre.

## Instalación y verificación

Extraer el patch en la raíz de frontend conservando rutas, ejecutar `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` y después `docker compose up -d --build`.

Pruebas manuales: sidebar MDT con 10 enlaces en altura 600/720 px, mobile con menú abierto, teclado Tab; conversión MOOC→MDT y MDT→MOOC con licencia habilitada, con bloques existentes, con datos históricos y sin modificaciones guardadas, en dos tenants con colores distintos; sin licencia debe denegar la operación, docente no puede abrir Configuraciones.
