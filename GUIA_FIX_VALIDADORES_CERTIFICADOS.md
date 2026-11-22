# Athena — Corrección TypeScript del validador de certificados

## Causa

En `lib/course-workspace/certificates.ts` los parsers reciben datos `unknown` de FastAPI. La función `invalid(): never` se invocaba como una expresión suelta `invalid();` dentro de validaciones con `if`. TypeScript no estrechaba el tipo del valor tras la condición, por lo que veía `v` / `entry` como `unknown` al usarlos.

## Solución

Se sustituyen las 16 llamadas a `invalid();` en guardas por `return invalid();`. Esto permite el análisis del flujo de control y mantiene exactamente la excepción anterior para entradas inválidas. No se usa `any`, no se relajan tipos y no cambian contratos, lógica de negocio ni archivos del backend.

## Instalación (Windows)

Extrae el ZIP en la raíz `C:\proyectosPersonales\LMSBasicG-frontend`, sobrescribiendo **solo**:

- `lib/course-workspace/certificates.ts`

A continuación, desde PowerShell:

```powershell
npm run typecheck
npm test
docker compose up -d --build
```

Si aparecen errores adicionales, compártelos; el parche corrige los del archivo aquí indicado, pero no se ha ejecutado el build completo con node_modules de la misma instalación de Docker.

## Verificación realizada

- TypeScript estricto aislado para `lib/course-workspace/certificates.ts`: sin errores.
- Suite de pruebas del frontend reconstruido a partir de los ZIP previamente entregados: 121 pruebas correctas.
- No se requirió migración Alembic ni modificaciones de Next.js, Docker o FastAPI.
