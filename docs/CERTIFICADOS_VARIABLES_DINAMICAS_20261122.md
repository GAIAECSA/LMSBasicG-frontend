# Athena · Editor de Certificados — variables dinámicas (2026-11-22)

Este cambio visual **no crea rutas ni modifica el contrato de plantillas**. El editor mantiene el tamaño `1122 × 794`, las posiciones, tipografías, QR y el flujo existente. Los datos del lienzo siguen siendo **textos ilustrativos**, nunca fechas oficiales.

## PDF de prueba

Cuando ADMIN pulsa **Generar PDF de prueba**, Next.js transmite los campos/QR/fondo y opcionalmente el `enrollment_id` a la misma ruta BFF `POST /api/courses/{id}/certificates/template/preview`, que consulta FastAPI. El backend calcula los valores finales:

- Inicio: fecha del curso; de lo contrario, fecha de creación de matrícula seleccionada.
- Fin: fecha del curso; de lo contrario, fecha actual de emisión (Ecuador).
- Docente: primer TEACHER aceptado del curso, por ID de matrícula ascendente, o vacío si no existe.

**Sin matrícula seleccionada**, se usan datos ficticios de alumno y el inicio queda vacío si el curso tampoco tiene fecha. No existe emisión, archivo almacenado ni QR oficial durante la prueba.

## Archivos

- Modificado: `components/campus/certificate-template-editor.tsx` — etiquetas/ayudas y ejemplos del lienzo.
- Nuevo: `tests/certificate-dynamic-fields.test.mjs` — reglas de UI y contrato BFF existente.

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

**No hay nuevas dependencias, migraciones, cambios de branding ni modificaciones a la vista STUDENT**.
