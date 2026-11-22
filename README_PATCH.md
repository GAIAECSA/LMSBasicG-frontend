# Athena — Ajuste visual del documento MDT

## Comportamiento

- PDF disponible: la celda Documento muestra únicamente el botón **Ver PDF**.
- Sin adjuntos: muestra **Sin adjuntos**.
- Se ocultan de la tabla el nombre y el tamaño de los archivos; el visor conserva la información del PDF.
- Documentos históricos que no sean PDF mantienen la opción **Descargar anterior** para no perder acceso a los archivos existentes.
- Se conservan subir, reemplazar, visor, descarga opcional dentro del visor, auditoría y permisos.

## Instalación

Copiar los archivos completos sobre la raíz del frontend Next.js, conservando las rutas:

- MODIFICAR `components/campus/mdt-student-documents.tsx`
- MODIFICAR `tests/mdt-resources-pdf.test.mjs`

Ejecutar `npm test` y reconstruir el servicio frontend si se utiliza Docker.
No requiere cambios al backend, dependencias ni migración Alembic.

Validación local: 105/105 tests de Node aprobados. No se ejecutó `typecheck`/`build` al no incluirse dependencias npm instaladas.
