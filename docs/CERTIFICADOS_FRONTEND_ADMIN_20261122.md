# Athena — Certificados ADMIN (frontend)

**Fecha:** 2026-11-22. **Alcance:** exclusivamente ADMIN del tenant, dentro del curso.
**Backend requerido:** parche `Athena_Backend_Certificados_Completo_MOOC_MDT_20261122.zip` y migración `20261122_0004`; depende de Calificaciones corregido (exclusión de bloques sin `lesson_id`).

## Pantalla y roles

Ruta administrativa `/campus/courses/{id}/certificates`. Mantiene `CampusShell` y las restricciones de `getCourseWorkspace`: solo rol de plataforma ADMIN. El BFF vuelve a comprobar sesión, tenant, políticas y acceso antes de cada operación; FastAPI aplica las reglas finales. TEACHER no ve ni puede invocar esta sección. No se construye la interfaz STUDENT en esta fase.

### MOOC

- **Plantilla y diseño:** dos presets (`classic` y `modern`) descargados de FastAPI, o imagen de fondo privada JPG/PNG/WEBP de máximo 10 MiB. Editor con campos de datos, posición, tamaño, tipografía, texto libre, alineación, color y QR obligatorio. Formato de diseño `fields` y `qr_config` idéntico al backend.
- El lienzo es **1122 × 794 px CSS**, escalado geométricamente sin alterar las coordenadas JSON. Al arrastrar, el editor convierte desplazamiento visual a coordenadas base. Controles numéricos para precisión y dispositivos táctiles. Se usan en la vista local alias de fuente DejaVu si están instalados; **el PDF generado por FastAPI mediante «Generar PDF de prueba» es la referencia tipográfica definitiva**, pues las fuentes del navegador pueden diferir.
- `POST /api/courses/{id}/certificates/template/preview` acepta diseño no guardado, imagen recién seleccionada y `enrollment_id` opcional. Devuelve un PDF **temporal en memoria del navegador** con marca de agua y datos de prueba; no emite, registra ni guarda certificados. El blob URL se revoca al cerrar.
- Guardar plantilla se realiza mediante `PUT /api/courses/{id}/certificates/template`. Los certificados ya emitidos no cambian de forma retroactiva.
- **Limitación real de FastAPI:** permite crear/reemplazar un fondo, pero todavía no ofrece un endpoint para **eliminar un fondo previamente guardado**. Al cambiar de preset se conservan fondos anteriores: se advierte al ADMIN y se permite reemplazarlos. No mostrar un botón falso de eliminación definitiva.
- **Certificados automáticos:** listado administrativo paginado (`limit`/`offset`), filtros de la página cargada, estado, código, nota y titular. ADMIN puede consultar PDF, descargar, revocar, renovar y ver historial/archivos históricos. No existe botón de emisión inicial ADMIN. La emisión (`POST /certificates/{id}/generate`) corresponde únicamente al STUDENT MOOC en futura vista.
- **QR:** obligatorio; el destino lo genera FastAPI a partir del tenant y código. El editor usa un marcador visual QR; el PDF de prueba genera un QR de muestra y marca de agua. Se respeta la verificación pública sin login ya expuesta por FastAPI.

### MDT

- **Ministerio del Trabajo** visible para cursos MDT, e **Institucional** cuando `certificate_types` incluye `INSTITUTIONAL` activo. Capacidad `AUTOMATIC` opcional MDT no se elimina del backend, pero en esta fase no se habilita su generación.
- Consulta de alumnos por matrícula `STUDENT` en estado `ACEPTADO`, búsqueda y paginación remotas. La respuesta incluye el estado/certificado por `idnumber_hash`, sin exponer cédulas ni URLs privadas al navegador.
- **Masiva:** selección de PDF, tope de 25 MiB por archivo, máximo 400 archivos seleccionados por operación de UI, divididos en solicitudes secuenciales de 20. Cada archivo debe contener una cédula ecuatoriana válida y única en su nombre; FastAPI comprueba e importa, devolviendo éxito/error individual. En interrupciones verificar listado antes de reintentar un lote.
- **Individual:** ADMIN selecciona estudiante ACEPTADO con cédula documentada y carga PDF de nombre libre; si el nombre contiene cédula, FastAPI exige coincidencia. Se conserva almacenamiento por identidad (`idnumber` cifrado / `idnumber_hash`) y no se crea FK a `user_id`.
- **Corrección:** PDF existente se reemplaza con motivo obligatorio. La operación se audita como `CORRECT` y conserva PDF anterior. **No hay revocación/renovación de certificados externos**.
- Visor y descarga son endpoints privados de BFF (cookies HttpOnly → FastAPI), nunca `file_url` ni credenciales en enlaces. Historial permite descargar versión registrada o anterior.

## API BFF

Raíz: `/api/courses/{courseId}/certificates/[[...action]]`, solo ADMIN:

| Método | Sufijo | FastAPI |
|---|---|---|
| GET | `presets` | `/api/v1/certificate-templates/presets` |
| GET/PUT | `template` | `/api/v1/certificate-templates/courses/{id}` |
| GET | `template/background` | `/api/v1/certificate-templates/courses/{id}/background` |
| POST | `template/preview` | `/api/v1/certificate-templates/courses/{id}/preview` |
| GET | `automatic?limit=50&offset=0` | `/api/v1/certificates/?course_id={id}&limit=50&offset=0` |
| POST | `automatic/{certificateId}/revoke` o `/renew` | `/api/v1/certificates/{certificateId}/{acción}` |
| GET | `automatic/{certificateId}/preview`, `/download`, `/history` | rutas homólogas de FastAPI |
| GET | `automatic/{certificateId}/history/{eventId}/pdf` o `/previous-pdf` | PDF históricos privados |
| GET | `external/students?...` | `/api/v1/external-certificates/courses/{id}/students` |
| POST | `external/import?type=MDT|INSTITUTIONAL` | `/api/v1/external-certificates/import` |
| POST | `external/students/{enrollmentId}` | `/api/v1/external-certificates/courses/{id}/students/{enrollmentId}` |
| PUT | `external/{externalId}/file` | `/api/v1/external-certificates/{id}/file` |
| GET | `external/{externalId}/preview`, `/download`, `/history` | rutas homólogas de FastAPI |
| GET | `external/{externalId}/history/{eventId}/pdf` o `/previous-pdf` | versiones históricas |

El BFF hace allowlist de rutas, métodos y parámetros, validación de origen en mutaciones, límites de bytes reales para multipart, prohíbe seguir redirecciones y filtra los tipos MIME de PDF/imagen. Los cuerpos de PDF se envían en streaming y llevan `no-store`, `SAMEORIGIN`, `nosniff`, `frame-ancestors 'self'`. FastAPI verifica nuevamente permisos, capacidades y titularidad.

## Decisiones visuales

Estilos exclusivos en `components/campus/course-certificates.module.css`. La interfaz utiliza `workspace-panel`, botones comunes, superficies neutras y los tokens `--tenant-primary`, `--tenant-accent-ink`, `--lms-brand-tint`, `--lms-brand-border`. No introduce colores institucionales fijos. Escalado del editor y desplazamiento horizontal de tablas; controles numéricos alternativos en móviles. Los colores para aprobado, pendiente y revocado son semánticos.

## Limitaciones / verificaciones pendientes

- Plantillas antiguas con QR nulo se normalizan al QR obligatorio por defecto. No se pierden campos previos.
- La búsqueda y filtro de certificados automáticos se aplica **solo a la página actual** porque el backend no admite búsqueda ni devuelve total en su endpoint administrativo. La paginación se realiza de 50 en 50.
- El frontend no verifica criptográficamente firmas electrónicas de PDFs externos; FastAPI los conserva sin modificar.
- El QR público apunta a la API de verificación; en un futuro se puede implementar una pantalla pública más visual, sin cambiar el código del certificado.
- Pruebas realizadas con Node Test Runner; antes de producción ejecutar `npm ci && npm test && npm run typecheck && npm run lint && npm run build`, comprobar en navegador edición táctil, posiciones, fuentes, PDFs y subida masiva con PostgreSQL/almacenamiento real.
