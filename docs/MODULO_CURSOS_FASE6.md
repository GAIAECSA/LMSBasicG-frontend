# Athena — Fase 6: Categorías, subcategorías, cursos

**Fecha:** 19-11-2026. **Base exacta:** `ATHENA_FRONTEND_FASE5_USUARIOS_COMPLETO.zip` (con Fase 5 de Usuarios). El backend NO se modifica en este PATCH.

## 1. Reglas aprobadas

- Menú ADMIN: `Gestión de usuarios → Usuarios`, `Cursos → Categorías / Subcategorías / Cursos`, `Administración → Políticas`. Se retira **Matrículas y notas** como menú global. No se crean pantallas de VISITOR.
- Categorías y subcategorías: CRUD completo, eliminación lógica; FastAPI bloquea eliminación con descendientes activos.
- Cursos: CRUD, creación con `is_published=false` incondicionalmente, sin asignación de docentes y sin checkbox `is_mdt`. El tipo de curso es **MOOC o MDT**; lo escoge el administrador únicamente si el plan lo habilita. FastAPI materializa bloques, encuesta y capacidades de certificados: Next.js nunca lo duplica.
- CourseUpdate NO recibe `course_type_id`: la transición requiere `POST /courses/{id}/course-type/preview` y, tras confirmación, `POST /courses/{id}/course-type/change` con `confirm:true`.
- Método: `AVERAGE` predeterminado; se modifica exclusivamente dentro de `/campus/courses/{id}` por `PATCH /quiz/courses/{id}/grade-method` con `{ "method": "AVERAGE" | "WEIGHTED" }`; se comunica la cantidad recalculada que devuelve FastAPI.
- Si un tenant deja de tener licencia para un tipo, los cursos **existentes se mantienen funcionales y reciben matrículas**; solo se prohíben crear cursos nuevos o convertir otros a ese tipo.
- DELETE es soft-delete con advertencia visible, INCLUSO CON MATRÍCULAS (elección explícita del proyecto). Se preservan datos históricos en FastAPI.
- No se añade «Organización». Precio, descuento, moneda, imagen, nivel, fechas, horas, total de lecciones, gratuidad, publicación y matrícula abierta se conservan.

## 2. URLs y responsabilidades

| UI (solo ADMIN) | BFF en Next.js | FastAPI |
|---|---|---|
| `/campus/categories` | `GET,POST /api/academic/categories`; `PATCH,DELETE /api/academic/categories/{id}` | `/api/v1/categories[/{id}]` |
| `/campus/subcategories` | `GET,POST /api/academic/subcategories`; `PATCH,DELETE /api/academic/subcategories/{id}` | `/api/v1/subcategories[/{id}]` |
| `/campus/courses` | `GET,POST /api/academic/courses`; `GET,PATCH,DELETE /api/academic/courses/{id}` | `/api/v1/courses[/{id}]` |
| `/campus/courses/{id}` | `POST /api/academic/courses/{id}/type-preview` | `POST /api/v1/courses/{id}/course-type/preview` |
| idem | `POST /api/academic/courses/{id}/type-change` | `POST /api/v1/courses/{id}/course-type/change` |
| idem | `PATCH /api/academic/courses/{id}/grade-method` | `PATCH /api/v1/quiz/courses/{id}/grade-method` |
| listado y detalle | `GET /api/academic/courses/{id}/image` | `/uploads/tenant_{business_id}/courses/images/{filename}` (únicamente para cursos publicados) |
| selector / plan | `GET /api/academic/course-types` | `GET /api/v1/course-types`, `GET /api/v1/business-lms-config/me/modules` (consultado por `authState`) |

Cada página SSR revalida `authState` (tenant, JWT, políticas) y el rol `ADMIN/PLATFORM`. Cada ruta BFF repite esa validación, protege mutaciones con Origin, limita tamaños de cuerpos y valida respuestas de FastAPI. FastAPI continúa siendo la autoridad de datos y permisos. El frontend usa cookie host-only HttpOnly; nunca expone JWT al navegador.

## 3. AJUSTE BACKEND IMPRESCINDIBLE: licencias de modalidades

**Situación del ZIP backend de referencia:** `app/services/course_service.py` comprueba existencia/actividad del `CourseType` en `create_course` y `change_course_type`, pero NO verifica el plan `BusinessLmsConfig`. `app/schemas/business_modules.py` devuelve códigos/configuración de LMS; no hay correlación formal entre `LmsConfig.code` y `CourseType.code`. El seed de los tipos MOOC/MDT está en `app/scripts/seed_initial_data.py`, pero NO fija las capacidades por tenant.

**Trabajo sugerido en FastAPI:**

1. Definir en código/BD la relación **estable y documentada** entre `LmsConfig.code` y `CourseType.code` (sin hardcodear IDs; un código distinto por capacidad). Ejemplo conceptual: `"CURSOS_MOOC" → "MOOC"`, `"CURSOS_MDT" → "MDT"`. Los códigos REALES deben ser los de la BD.
2. Implementar en servicio de configuración un validador `assert_course_type_creatable(db, business_id, course_type_code)` que consulte `business_lms_configs` activas, `lms_configs` activas, no eliminadas. Debe negar si no hay capacidad, incluido tenant sin config.
3. Llamarlo dentro de la transacción de **`course_service.create_course`** inmediatamente después de resolver `course_type` y **`course_service.change_course_type`** antes de mutar bloques, certificados o asistencias. También recomendable en `preview_course_type_change` para devolver respuesta coherente.
4. Mantener **GET, PATCH, matrícula y las operaciones normales** de cursos existentes incluso si la capacidad expira. No ocultar cursos, no cascada. No bloquear transición a tipo actual si no hay cambio.
5. Devolver error determinista **403** cuando el tenant no tiene la capacidad, y añadirlo a `_handle` en `app/api/v1/course_routes.py`. Incorporar pruebas multi-tenant, reintentos, licencias activas/inactivas y transición MOOC ↔ MDT.

**Adaptación FRONT:** `lib/academic/types.ts::enabledCourseCodes` compara exclusivamente `module.code` con los códigos explícitos de `ATHENA_LMS_MOOC_CODE` y `ATHENA_LMS_MDT_CODE`. Defaults: `MOOC`, `MDT`. Si tus `lms_configs.code` son otros, configurar los nombres reales en `.env` antes de desplegar; `compose.yaml` reenvía las variables al contenedor. Sin coincidencia exacta, **no se puede crear ni cambiar a ese tipo**, aunque sí administrar los existentes. Este filtrado de interfaz/BFF **no sustituye** el validador de FastAPI.

## 4. Mejoras recomendadas en backend (NO bloqueantes)

- En `app/schemas/course.py`, `CourseUpdate.as_form` descarta `None` en campos opcionales. No permite quitar `discount_price`, `init_date` y `finish_date` sin enviar cambios colaterales. Proponer protocolo explícito con campos `clear_discount_price`, `clear_init_date`, `clear_finish_date` (o JSON Patch) y validaciones del servicio; evita ambigüedad entre «no enviado» y «limpiar». El frontend actual conserva el valor anterior cuando se deja vacío y avisa de esa limitación; para limpiar descuento, `is_free=true` sí lo borra, pero también pone el precio en cero.
- El endpoint de imágenes público de FastAPI (`app/main.py`) solo entrega portadas de cursos publicados. Por seguridad el frontend **no intenta leer portadas de cursos borrador** mediante la ruta pública. Si quieres verlas cuando editas un borrador, añadir un endpoint autenticado ADMIN por curso y tenant en FastAPI para servir imágenes privadas de borradores, o un token de acceso temporal. No montar el directorio de uploads como estático.
- Si deseas controlar publicación de forma central, `CourseCreate.is_published=True` actualmente por defecto; Next.js manda `false` y lo obliga. Opcionalmente cambiar el default del backend a `False` para que otras integraciones tampoco publiquen por accidente.

## 5. Integración y comprobación

1. Aplicar `ATHENA_FASE6_CURSOS_PATCH.zip` sobre el frontend de Fase 5 **sin modificar sus rutas preexistentes**; incluye nuevas rutas/components y reemplazo del shell/CSS/compose/env.
2. Revisar `ATHENA_LMS_MOOC_CODE`, `ATHENA_LMS_MDT_CODE` con los valores reales de `lms_configs.code` de tu base, y los registros `business_lms_configs` habilitados para el tenant. Reiniciar Next.js.
3. Ejecutar `npm ci && npm run typecheck && npm run lint && npm test && npm run build`. Comprobar también `docker compose config` y desplegar normalmente.
4. Probar en base real: CRUD categorías, validación de categoría en subcategorías, filtros, creación como borrador de cada tipo autorizado, carga de portada, publicación, soft-delete con y sin matrículas, método AVERAGE/WEIGHTED y recálculo, preview/confirmación MOOC ↔ MDT, guard 401/403/428, tenant A vs tenant B.

**Estado de verificación en entorno de elaboración:** 43 tests automatizados de Node pasaron (34 existentes + 9 Fase 6); sintaxis/transpilación de 75 archivos TS/TSX comprobada. El build de Next.js y pruebas de integración NO se pudieron verificar sin dependencias de npm y un backend/PostgreSQL vivos. Las nuevas rutas son implementación acorde con los contratos examinados, no certificación end-to-end.

**Futuras fases:** contenidos (módulos, lecciones, LessonBlocks), matrículas/roles STUDENT/TEACHER, detalle de notas, asistencias, certificados, reportes. Los accesos aparecen deshabilitados y claramente marcados, no funcionales hasta implementación específica.
