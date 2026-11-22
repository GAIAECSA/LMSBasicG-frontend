# Athena — Calificaciones frontend (ADMIN / TEACHER)

**Versión:** 21-11-2026. **Alcance:** vista de solo lectura, cursos MOOC/MDT.

## Precondición obligatoria

Aplicar al backend **Athena_Backend_Calificaciones_CORREGIDO_Sin_Bloques_Raiz_20261121.zip**;
no usar la primera versión. En el contrato corregido, las actividades `quiz` y
`homework` **solo aparecen y cuentan si `lesson_id IS NOT NULL`**, lección del
curso actual, bloque activo y no eliminado. Recursos MDT raíz, PDF, Survey,
Forum y demás tipos no aparecen. Solo estudiantes matriculados `ACEPTADO` con
rol de curso `STUDENT`. ADMIN y TEACHER autorizado pueden consultar.

## Arquitectura

```text
/campus/courses/{id}/grades (App Router + getCourseWorkspace)
  → components/campus/course-grades.tsx (solo presentación/GET)
  → lib/course-workspace/grades.ts (tipos, validación, URLs y formato)
  → GET /api/courses/{id}/grades (BFF con cookie HttpOnly y autorización)
  → GET /api/v1/courses/{id}/grades (FastAPI, tenant + permisos + cálculo)
```

La respuesta FastAPI define `grade_calculation_method`, `grade_scale_max=10`,
actividades, estudiantes, notas finales y estados. Los `Decimal` son cadenas
(p. ej. `"7.33"`); el frontend solo presenta dos decimales, nunca vuelve a
calcular promedio ni ponderación. `null` se muestra `—`; `"0.00"` es cero real.
Los cambios de filtro no alteran la nota final.

## Controles

| Control | API / efecto |
| --- | --- |
| Buscar | `search`; nombre, usuario o correo; búsqueda con debounce |
| Inclusión | `activity_filter`: `ALL`, `COUNTED`, `NOT_COUNTED` |
| Tipo | `activity_type`: `ALL`, `quiz`, `homework` |
| Página de estudiantes | `page`, `page_size` (máximo 100) |
| Página de actividades | `activity_page`, `activity_page_size` (máximo 100) |
| Actualizar | Reconsulta los datos sin modificarlos |

Todos los parámetros se validan y se envían mediante URLSearchParams en la ruta
same-origin del BFF. Nunca se acepta un `business_id` o `user_id` del cliente.
El BFF controla la sesión, tenant y rol de workspace; FastAPI vuelve a comprobar
permiso. Las respuestas usan `Cache-Control: private, no-store`.

## Vista y reglas de diseño

- Desktop: tabla con dos columnas sticky (`Estudiante`, `Nota final`) y columnas
  de actividades desplazables. Cada actividad muestra título, tipo, módulo,
  lección, si cuenta y peso relativo en método ponderado.
- Móvil: tarjetas por estudiante, expandibles con nota final y actividades
  visibles. Se aplican los mismos filtros/páginas de la API.
- Sin notas: `—`/Sin notas, sin confundir con cero calificado. Estados de celda:
  `CALIFICADO`, `SIN_INTENTAR`, `SIN_CALIFICAR`, `PENDIENTE`, `ENTREGADO`.
- Se respeta `DISENO_Y_BRANDING.md`: estilos CSS module aislados, colores del
  tenant por variables y estados semánticos neutros.
- No hay formularios, POST/PATCH, botones de calificar ni cambios del aula STUDENT.

## Archivos para instalar

**Nuevos:**

- `lib/course-workspace/grades.ts`
- `app/api/courses/[id]/grades/route.ts`
- `components/campus/course-grades.tsx`
- `components/campus/course-grades.module.css`
- `tests/course-grades.test.mjs`
- `docs/CALIFICACIONES_FRONTEND.md`

**Modificados:**

- `app/campus/courses/[id]/[section]/page.tsx`
- `README.md`
- `docs/DISENO_Y_BRANDING.md`
- `docs/DECISIONES_Y_CAMBIOS.md`

Copiar los archivos **completos** del ZIP sobre la raíz del frontend que ya
tiene Recursos MDT. No sobrescribir otros módulos ni los archivos `.env`.

## Validación local (PowerShell)

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

En Docker: reconstruir el servicio frontend después de copiar el parche. Probar
ADMIN y TEACHER aceptado, denegar STUDENT/TEACHER no aceptado, comparar notas
con FastAPI para AVERAGE/WEIGHTED, revisar Quiz y Homework con/sin calificación,
filtrar columnas (la final no cambia), y verificar que los recursos raíz MDT no
aparezcan. Validar visualmente en PC y teléfono y con dos temas de tenant.
