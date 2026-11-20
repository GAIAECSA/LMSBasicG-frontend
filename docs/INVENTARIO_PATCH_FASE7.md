# Inventario de archivos — Patch frontend Fase 7 VISITOR

Fecha: 20/11/2026. **ZIP incremental con archivos completos**, para extraer directamente sobre la raíz del frontend `LMSBasicG-frontend-real-SAAS` (la base del 20/11, después de las fases previas). **NO es un patch de líneas ni el frontend anterior `mdtbranch`.**

## Agregar (10 archivos)

```text
app/campus/my-courses/page.tsx
app/campus/catalog/page.tsx
app/campus/certificates/page.tsx
components/campus/visitor-my-courses.tsx
components/campus/visitor-catalog.tsx
components/campus/visitor-certificates.tsx
lib/visitor/types.ts
lib/visitor/data.ts
tests/visitor-phase7.test.mjs
docs/VISITOR_FASE7.md
```

## Modificar (6 archivos)

```text
app/campus/page.tsx
app/globals.css
components/campus/campus-shell.tsx
docs/DISENO_Y_BRANDING.md
docs/DECISIONES_Y_CAMBIOS.md
README.md
```

Este inventario se incorpora al ZIP como archivo adicional de documentación.

## Instalación

1. Hacer copia de seguridad / commit del estado previo.
2. Descomprimir el ZIP incremental desde la **raíz del frontend**. Permitir sobrescritura de los seis archivos modificados; los restantes son nuevos. Si descomprimes en una subcarpeta se duplicará `app/` y no funcionará.
3. No tocar `.env`, Docker, Nginx, backend ni base de datos.
4. Instalar dependencias del proyecto como de costumbre y ejecutar `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
5. Reiniciar Next.js o reconstruir con `docker compose up -d --build` donde corresponda. No hay nuevas variables de entorno.
6. Verificar un usuario con `role.code=VISITOR`, `scope=PLATFORM` y matrículas `STUDENT`/`TEACHER`: revisar `docs/VISITOR_FASE7.md`.

## Criterios de aceptación clave

- Login VISITOR → `/campus/my-courses`, sin «Inicio».
- Curso publicado y matrícula ACEPTADO aparece **aunque** `open_enrollment=false`.
- Curso borrador nunca aparece en Mis cursos ni en el catálogo; matrícula PENDIENTE no habilita un curso.
- Progreso STUDENT calculado de bloques activos; sin datos, «Progreso aún no disponible»; TEACHER «No aplica».
- «Cursos» solo muestra publicaciones del tenant; filtros funcionan; no solicitar matrícula ni dirigir a aula.
- «Certificados» aparece, pero no consulta certificados aún.
- ADMIN conserva Inicio y todos los módulos ya migrados.

**Verificación durante elaboración:** `npm test` 55/55; parser TypeScript sobre 84 archivos TS/TSX sin errores de sintaxis. Sin node_modules para ejecutar en este entorno el build Next/ESLint/typecheck. El flujo real contra PostgreSQL/FastAPI necesita validación en el despliegue del usuario.
