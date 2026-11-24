# Fase 4 — Inicio del campus tras autenticación

## Alcance y comportamiento

1. El usuario abre `/login` desde un hostname registrado. `resolveTenant()` identifica el `business_id` en FastAPI y el login conserva la cookie HttpOnly host-only (Fase 2).
2. Cuando se autentica, Next.js comprueba políticas obligatorias (`/policies/pending`) antes de consultar `/users/me` o módulos. Si existe alguna pendiente, se redirige al wizard `/policies`. Rechazar provoca logout.
3. Al terminar las políticas o si no hay pendientes, navega a `/campus`. `app/campus/page.tsx` vuelve a comprobar `authState(tenant)` en el servidor: token, tenant, revocación, rol y módulos. Sin sesión redirige a `/login`; con pendientes, a `/policies`; ante indisponibilidad no revela el contenido.
4. `CampusClient` compone el shell compartido y la pantalla `CampusHome`, no una confirmación de login. `CampusShell` ya existía desde Fase 3 y se conserva intacto.
5. ADMIN/PLATFORM ve **Administración → Políticas**; los demás roles autorizados ven **Información → Políticas**. Al elegirlo se abre `/campus/policies`, con gestión de versiones exclusivamente para administradores y consulta para los demás. FastAPI y el BFF reiteran las comprobaciones de acceso.
6. `CampusHome` incluye el catálogo público (`/`), la sección Políticas, información de la cuenta y lista de módulos habilitados por FastAPI. La lista **no** concede privilegios ni promete que existan pantallas completas para esos módulos.

## Qué se cambió y motivos

| Archivo | Cambio | Motivo |
| --- | --- | --- |
| `components/auth/campus-client.tsx` | Renderiza `CampusShell` + `CampusHome` | Sustituir definitivamente la tarjeta provisional y reutilizar el layout de Políticas |
| `components/campus/campus-home.tsx` (nuevo) | Inicio modular, accesos realmente navegables y datos de sesión/tenant/módulos | Entrar al campus y comenzar a utilizar el módulo disponible sin falsificar funciones |
| `app/campus/page.tsx` | Comentarios que explican flujo vigente; conserva el guard SSR | Mantener explícitas las fronteras de autorización |
| `app/globals.css` | Estilos responsive del inicio; elimina reglas de `lms-arrived` | Corregir visual y mantener neutrales combinables con cualquier color de academia |
| `README.md` | Actualiza estado real y despliegue | Evitar documentación que diga que el campus aún muestra «Llegaste» |
| `docs/DECISIONES_Y_CAMBIOS.md` | Entrada detallada fase 4 | Trazabilidad de qué/cómo/por qué |
| `docs/VERIFICACION.md`, `docs/INVENTARIO_PATCH_FASE4.md` | Pruebas y lista de archivos | Instalación incremental sin sobrescribir Docker/env |
| `tests/campus-phase4.test.mjs` | Tests de rutas, seguridad y eliminación del placeholder | Detectar regresión hacia una pantalla provisional |

## URLs para probar

- `http://127.0.0.1:8080/login` — login (redirecciona al campus si ya existe sesión válida).
- `http://127.0.0.1:8080/policies` — solo cuando hay políticas obligatorias pendientes.
- `http://127.0.0.1:8080/campus` — inicio real con menú lateral (requiere sesión válida).
- `http://127.0.0.1:8080/campus/policies` — módulo funcional de Políticas.

El dominio `127.0.0.1` es solo el ejemplo local: en un entorno compartido usar el dominio registrado en `businesses.tenant_domain`. `BACKEND_INTERNAL_URL` debe continuar apuntando a FastAPI desde el contenedor Next.js, no a `127.0.0.1` dentro de él.

## Pasos para instalar

```powershell
# Desde la carpeta del frontend, después de superponer el ZIP Fase 4
npm test
# Opcional si se usan dependencias npm instaladas localmente
npm run typecheck
npm run build
docker compose up -d --build
```

Mantener los archivos existentes `.env`, Dockerfile, `compose.yaml` y Nginx: este parche no los reemplaza ni requiere configuraciones nuevas.

## Cambios de backend necesarios o pendientes

**Para este cambio específico, ninguno.** Las rutas y gates ya están disponibles en FastAPI según las fases anteriores.

Permanecen pendientes conocidos de otras fases, si no se resolvieron aún:

- Refresh tokens con rotación para renovar una sesión sin volver a ingresar credenciales; hoy se detecta caducidad y se pide nuevo login.
- El login de `STUDENT/COURSE` y `TEACHER/COURSE` estaba restringido por FastAPI, pese a existir esos roles en seeds. Sin cambiarlo no se pueden probar esos perfiles de extremo a extremo.
- Los módulos de usuarios, cursos y matrículas todavía no tienen páginas en este nuevo frontend: se conservan deshabilitados hasta refactorizarlos.

## Seguridad

Nunca usar `TenantModule` para elevar un rol, otorgar permisos ni decidir acceso a `/campus/policies`. El módulo de políticas revalida sesión y tenant mediante el servidor, y el backend valida permisos. La vista de inicio solo refleja módulos que FastAPI ya consideró habilitados para este tenant.
