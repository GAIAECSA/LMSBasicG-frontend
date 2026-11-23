# Athena LMS — Hotfix TypeScript Modules v2

## Instalación

Este ZIP contiene **dos archivos completos** con sus rutas originales. Copiar y reemplazar en la raíz del frontend `LMSBasicG-frontend`:

- `components/campus/course-module-preview.tsx`
- `components/campus/course-module-block-editor.tsx`

No cambia API, base de datos, Dockerfile ni dependencias. Incluye la corrección previa de `quizPayload()` para evitar perderla al reemplazar el segundo archivo.

## Correcciones

- En la vista previa, `content.file_url` era de tipo `unknown`; al usarlo directamente en expresiones JSX con `&&`, el resultado de la expresión podía ser `unknown` y no un `ReactNode` válido. Se verifica que sea una cadena no vacía y se usa `hasUploadedFile` de tipo booleano para Imagen, PDF y Homework.
- En el configurador de recursos se usa la misma verificación booleana para los tres recursos y para validar que un PDF o una imagen tengan archivo.
- Se conserva el cambio de `quizPayload()` que evita acceder a `opts.length` cuando `opts === null` (verdadero/falso).

## Verificar en Windows

En la raíz del frontend, primero ejecutar `npm run typecheck` (con dependencias locales instaladas). Si pasa, ejecutar `docker compose up -d --build`.

Las pruebas incluidas validan los contratos existentes, pero la compilación TypeScript completa y el build real deben comprobarse en Windows si las dependencias npm no están disponibles en el entorno de análisis.
