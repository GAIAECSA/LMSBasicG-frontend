# Inventario — Parche frontend Certificados ADMIN (22/11/2026)

**Agregar archivos completos (11):**

1. `app/api/courses/[id]/certificates/[[...action]]/route.ts` — BFF protegido ADMIN: allowlist de operaciones, archivos privados y multipart por streaming.
2. `lib/course-workspace/certificates.ts` — DTO TypeScript, normalizadores, límites y herramientas.
3. `components/campus/course-certificates.tsx` — pantalla del curso y selector de modalidad/capacidad.
4. `components/campus/certificate-template-editor.tsx` — editor 1122×794, presets y PDF efímero.
5. `components/campus/certificate-automatic-manager.tsx` — lista, revocación, renovación e historial MOOC.
6. `components/campus/certificate-external-manager.tsx` — MDT/Institucional, importación, subida individual, corrección e historial.
7. `components/campus/certificate-pdf-viewer.tsx` — visor PDF privado reutilizable.
8. `components/campus/course-certificates.module.css` — estilos y responsive con branding.
9. `tests/course-certificates-admin.test.mjs` — pruebas de contrato, permisos, reglas y navegación.
10. `docs/CERTIFICADOS_FRONTEND_ADMIN_20261122.md` — contrato funcional y documentación vigente.
11. `docs/INVENTARIO_PATCH_CERTIFICADOS_FRONTEND_20261122.md` — este inventario.

**Reemplazar archivos completos (4):**

12. `app/campus/courses/[id]/[section]/page.tsx` — conecta «Certificados» únicamente en ADMIN, sin modificar los demás apartados.
13. `README.md` — estado del módulo.
14. `docs/DISENO_Y_BRANDING.md` — normas visuales y fidelidad de lienzo.
15. `docs/DECISIONES_Y_CAMBIOS.md` — decisiones de backend/frontend y limitaciones conocidas.

**Requisitos:** backend `20261122_0004`, Recursos MDT PDF vigente y módulo de Calificaciones corregido. Este parche está basado en `LMSBasicG-frontend-real-SAAS.zip` más los parches de Recursos MDT (incluido «Solo botón Ver PDF») y Calificaciones. No se debe aplicar sobre el frontend antiguo `mdtbranch`.

**Sin nuevas dependencias, sin migraciones frontend, sin cambios en Nginx.**

**Pruebas:** Node Test Runner 118/118 aprobadas; se verificó sintaxis TypeScript/TSX. `npm run typecheck`, `npm run lint`, `npm run build` y pruebas end-to-end no pudieron completarse por ausencia de dependencias npm plenamente instaladas en el entorno de elaboración.
