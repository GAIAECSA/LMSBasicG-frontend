# Athena LMS — Instalación del frontend del Aula STUDENT

**Fuente:** LMSBasicG-frontend-real-SAAS.zip (versión aportada por el usuario).  
**Backend requerido:** ATHENA_BACKEND_AULA_STUDENT_PATCH_2026-11-23.zip (aplicado al backend actual).

## Instalar

1. Haz respaldo del frontend y verifica que los cambios de Modules y Reportes MDT ya están integrados en tu rama.
2. Descomprime **este ZIP en la raíz del proyecto frontend** (donde están package.json, app/, components/, lib/), respetando las rutas y reemplazando solamente los archivos incluidos.
3. No requiere migraciones, cambios en variables de entorno, ni modificar package-lock.json.
4. Con conexión al registro npm ejecuta, desde la raíz del frontend:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

5. Con los chequeos satisfactorios, reconstruye tu frontend con `docker compose up -d --build`.

## Qué revisar en interfaz

- STUDENT de MOOC y MDT: Resumen, Contenido, Calificaciones, Certificado; solo botón principal «Continuar aprendiendo».
- ADMIN y TEACHER: mantener el workspace del curso y el menú actual.
- Texto/Imagen/PDF/Video: progreso automático al abrir; evaluación: progreso al realizar la acción.
- Quiz: intento, navegación pregunta a pregunta, envío y calificación; Homework: entrega y edición antes de calificar.
- Encuesta: respuesta única por audiencia con Likert de cinco caritas; Foro: publicaciones y respuestas anidadas.
- Documentos raíz MDT: cuatro PDFs exigidos, separados de las lecciones; no suman nota.
- Notas AVERAGE/WEIGHTED: calculadas solo por FastAPI, pendientes equivalen a cero en el promedio.
- Certificado MOOC: requisitos, emisión si procede, recuperación; MDT: opción ministerial/institucional y descarga protegida.
- Branding: comprobar colores/contraste y logo en al menos dos tenants, móvil/escritorio.

## Pruebas y limitaciones

`npm test` pasó con **148/148 pruebas** en el entorno de elaboración; el análisis sintáctico TS/TSX de los archivos modificados pasó. **No se pudo ejecutar el typecheck ni el build de Next.js completos** porque `npm ci` no pudo instalar paquetes (`EAI_AGAIN`). No se han verificado flujos E2E con PostgreSQL y Docker reales. Ver el detalle en `docs/AULA_STUDENT_FRONTEND_20261123.md`.

**Nota:** Si un estudiante abandona un intento de Quiz sin enviarlo, las respuestas seleccionadas aún no se guardan porque el contrato backend no ofrece persistencia parcial. La reanudación recupera las preguntas del intento y las respuestas deben volver a introducirse.
