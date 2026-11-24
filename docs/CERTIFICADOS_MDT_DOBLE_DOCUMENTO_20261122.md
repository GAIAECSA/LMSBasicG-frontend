# Certificados MDT — habilitación del segundo documento institucional

## Alcance

Solo **ADMIN**, dentro de **Configuraciones** de un curso de modalidad **MDT**, puede activar o desactivar el certificado institucional opcional. El certificado ministerial (`MDT`) es obligatorio y permanece activo. No se cambian cursos MOOC ni se habilita la generación automática MDT.

En **Certificados**, cuando `INSTITUTIONAL` está activo aparece una vista **Por estudiante** que consulta simultáneamente los dos tipos: Ministerio del Trabajo e Institucional. Cada tipo mantiene su propio PDF, historial, reemplazos y subida por matrícula / importación masiva. Los estudiantes visibles tienen matrícula `STUDENT` aceptada. En móvil la tabla permite desplazamiento horizontal sin comprimir los botones.

## Contratos reutilizados

- `GET /api/v1/courses/{id}` devuelve el curso actual y los tipos de certificado materializados. Un curso creado con capacidad institucional inactiva puede no tener todavía una fila institucional.
- `GET /api/v1/course-types/{course_type_id}` incluye `certificate_rules` con `required`, `default_active`, `certificate_type.id`, `certificate_type.code`.
- `PUT /api/v1/courses/{id}/certificate-types` recibe `{ "certificate_type_ids": [...] }`, la **lista completa** deseada, y devuelve `CourseResponse`. El backend incorpora los tipos obligatorios y conserva los datos históricos.
- BFF añadido: `GET` y `PUT /api/academic/courses/{id}/certificate-types`. El PUT recibe **únicamente** `{ "institutional_enabled": true|false }`, resuelve IDs en el servidor, conserva AUTOMATIC u otras capacidades activas y revalida respuesta. Exige sesión ADMIN y mismo origen para mutaciones.
- Se reutiliza el BFF de certificados externos (`/api/courses/{id}/certificates/external/students?certificate_type=MDT|INSTITUTIONAL`) para estado, visor, carga, correcciones e historial. Ninguna URL privada ni JWT llega al navegador.

## Decisiones de seguridad y datos

- No hardcodear IDs de certificados. Resolverlos por el código devuelto en reglas actuales de FastAPI.
- No incluir un `business_id` enviado por el navegador. La autorización se hace por sesión y tenant en BFF/FastAPI.
- La opción MOOC no se muestra ni acepta a través de esta ruta.
- Desactivar `INSTITUTIONAL` **no borra documentos ni eventos**: detiene temporalmente la gestión de ese tipo por curso. Activarlo nuevamente reutiliza la información previa si existe.
- Los cambios en Configuraciones son una operación independiente; no se unen al formulario general ni al cambio de modalidad.
- En la vista conjunta, las acciones por estudiante abren el gestor existente del tipo pertinente, conservando los modales de carga/corrección e historial.

## Prueba manual después de instalar

1. Entrar como ADMIN a curso MDT: Configuraciones → Certificados del curso; verificar ministerial siempre activo e institucional inicialmente desactivado.
2. Activar institucional y guardar; abrir Certificados: deben aparecer «Por estudiante», «Ministerio del Trabajo» e «Institucional».
3. Subir al mismo estudiante un PDF ministerial y otro institucional. Verificar ambos estados, sus visores y su historial por separado.
4. Desactivar institucional y comprobar que el ministerial sigue funcionando. Reactivar institucional y comprobar que el PDF institucional anterior reaparece (sin duplicarlo ni eliminarlo).
5. Comprobar que un curso MOOC conserva sus pestañas y no muestra esta configuración.
6. Confirmar que TEACHER y STUDENT no pueden invocar el PUT administrativo; comprobar en navegador móvil, pruebas y TypeScript.
