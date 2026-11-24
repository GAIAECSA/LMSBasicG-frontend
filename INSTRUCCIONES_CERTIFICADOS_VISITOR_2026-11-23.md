# Athena Real SaaS — Frontend de Certificados VISITOR

## Alcance

La sección `/campus/certificates` deja de ser un placeholder y muestra los certificados del titular agrupados por curso, sin consultar el catálogo público. La navegación lateral del campus VISITOR no cambia.

- BFF privado para previsualizar y descargar PDF; los tokens permanecen en la cookie HttpOnly.
- Filtrado MOOC/MDT y búsqueda en la página actual; paginación del backend.
- Los dos certificados MDT (ministerial e institucional) se muestran por separado cuando existen.
- Los cursos ocultos aparecen en la lista de certificados con nombre y documentos (si el servidor autoriza); no dependen de imágenes del catálogo público.
- MOOC permite generar una reserva elegible que aún no tenga PDF; después recarga el listado.
- Si un certificado MDT se cargó pero el titular todavía no cumple requisitos, se muestra bloqueado sin exponer el PDF.
- Se reutiliza el visor privado actual y los tokens de `docs/DISENO_Y_BRANDING.md` (sin branding fijo por cliente).

## Instalación

**Requisitos:** backend con parche `ATHENA_BACKEND_AULA_STUDENT_PATCH_2026-11-23.zip` y el ZIP complementario **Certificados VISITOR backend** de esta entrega; frontend con `ATHENA_FRONTEND_AULA_STUDENT_PATCH_2026-11-23.zip`.

Descomprimir este ZIP en la raíz del frontend. No hace falta ejecutar migraciones por este cambio. Ejecutar:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run build
docker compose up -d --build
```

Se aprobaron 153 pruebas frontend y la validación sintáctica de archivos TS/TSX. **No se certificó** el typecheck integral ni el build de producción en este entorno por falta de dependencias npm completas; verificar con los comandos anteriores.

## Pruebas manuales recomendadas

1. VISITOR con STUDENT aceptado en curso MDT **oculto**: acceder al certificado MDT/institucional; ambos cuando existan, separados.
2. VISITOR en curso MOOC oculto: abrir certificado emitido y probar la generación bajo demanda si está listo.
3. VISITOR sólo TEACHER: no se deben mostrar certificados de ese curso.
4. Certificado revocado: no aparece como descargable.
5. MDT con requisitos pendientes: PDF bloqueado.
6. MDT elegible: previsualizar no cambia `visited_at`, descargar sí actualiza la última fecha del reporte MDT.
7. Cuenta de otro tenant: no puede acceder ni con ID conocido.

El botón de descarga propio de un visor PDF del navegador puede guardar el PDF sin registrar `visited_at`; el botón «Descargar» de Athena sí utiliza la ruta que actualiza el registro. `visited_at` representa una solicitud de descarga, no confirmación de guardado físico.
