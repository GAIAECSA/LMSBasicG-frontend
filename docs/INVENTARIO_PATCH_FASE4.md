# Inventario exacto del parche Fase 4

Extraer sobre la raíz del **frontend actual tras Fase 3**, conservando la estructura de carpetas. Todos los archivos enumerados están incluidos completos en el ZIP; `+` es archivo nuevo y `~` es reemplazo completo.

| Operación | Ruta relativa |
| --- | --- |
| ~ | `README.md` |
| ~ | `app/campus/page.tsx` |
| ~ | `app/globals.css` |
| ~ | `components/auth/campus-client.tsx` |
| + | `components/campus/campus-home.tsx` |
| ~ | `docs/DECISIONES_Y_CAMBIOS.md` |
| + | `docs/INICIO_CAMPUS_FASE4.md` |
| + | `docs/INVENTARIO_PATCH_FASE4.md` |
| ~ | `docs/VERIFICACION.md` |
| + | `tests/campus-phase4.test.mjs` |

**No se incluyen ni modifican:** `app/login/*`, `app/policies/*`, `app/campus/policies/*`, `components/campus/campus-shell.tsx`, `components/campus/admin-policies.tsx`, `components/campus/my-policies.tsx`, `.env`, Dockerfile, `compose.yaml`, Nginx ni backend. Deben existir a partir de las fases anteriores.

Si sigue apareciendo «Hola, Admin» en una tarjeta antigua, verifica que realmente se sobrescribió `components/auth/campus-client.tsx` y que Docker reconstruyó la imagen. Si aparece «Llegaste», se está ejecutando una imagen o archivo anterior. `docker compose up -d --build` y `docker compose logs --tail=80 frontend` permiten comprobar el despliegue.
