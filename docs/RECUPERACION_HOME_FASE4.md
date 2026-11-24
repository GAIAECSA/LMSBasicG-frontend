# Recuperación del Home: Fases 2–4 consolidadas

## Diagnóstico

La captura muestra la tarjeta **«Hola, Admin»** con el mensaje **«La portada y autenticación multi-tenant ya están listas»**. Esa cadena está en el componente `components/auth/campus-client.tsx` de Fase 1. La versión correcta debe incluir `CampusShell` y `CampusHome`, por lo que el problema observado es un despliegue del frontend antiguo o la aplicación incompleta de los parches.

## Instalación (Windows / PowerShell)

1. Haz una copia de tu proyecto si tienes cambios locales. **Extrae el ZIP directamente sobre** `C:\proyectosPersonales\LMSBasicG-frontend\` (no en una subcarpeta) y permite sobrescribir.
2. En esa ruta, ejecuta: `powershell -ExecutionPolicy Bypass -File .\VERIFICAR_Y_RECONSTRUIR.ps1` (o ejecuta manualmente los pasos siguientes).
3. Si prefieres hacerlo manualmente: `docker compose build --no-cache frontend` y luego `docker compose up -d --force-recreate`.
4. Abre `http://127.0.0.1:8080/campus` tras autenticar. Si el navegador guarda recursos viejos, prueba Ctrl+F5 o InPrivate.

Para **verificar sin reconstruir**, ejecuta `powershell -ExecutionPolicy Bypass -File .\VERIFICAR_Y_RECONSTRUIR.ps1 -SoloVerificar`.

## Flujo previsto

- `POST /api/auth/login` resuelve el tenant y llama al backend con el dominio canónico. Comprueba credenciales y pregunta por políticas obligatorias pendientes.
- Si la respuesta de `/api/v1/policies/pending` es `[]`, la propiedad `requiresPolicies` es `false`, de forma que redirige directamente a `/campus`. **No hay que publicar políticas para iniciar sesión.**
- Si existen políticas pendientes, se redirige a `/policies` para aceptarlas consecutivamente o cerrar sesión si se rechazan.
- `/campus` valida la sesión en el servidor y renderiza el Home con barra lateral. La sección es «Administración → Políticas» para `ADMIN/PLATFORM` e «Información → Políticas» para otros roles permitidos por el backend.
- El menú de otros módulos se mantiene desactivado hasta migrar sus pantallas.

## Archivos relevantes

- `components/auth/campus-client.tsx`: sustitución definitiva de tarjeta provisional por shell y home.
- `components/campus/campus-home.tsx`: página de Inicio.
- `components/campus/campus-shell.tsx`: navegación contextual y logout.
- `app/campus/page.tsx`: protección SSR por sesión y estado de políticas.
- `components/auth/login-form.tsx` y `app/api/auth/login/route.ts`: salto correcto a wizard o al Home según policies pendientes.
- `lib/auth/server.ts`: comprobación de sesión, policies y módulos con FastAPI.
- `tests/campus-recuperacion.test.mjs`: pruebas de regresión.

## Cambios en FastAPI

Ninguno para esta corrección. No modificar `tenant_domain`, `BACKEND_INTERNAL_URL`, `BACKEND_UPSTREAM`, base de datos ni el `compose.yaml` existente.

## Verificación

Las pruebas locales de código y sintaxis son independientes de una compilación Docker real. La aceptación final requiere ejecutar `docker compose build` y probar la autenticación en tu entorno de desarrollo.
