# Athena — Corrección definitiva del tipado de pestañas de Certificados

## Causa verificada

El segundo hotfix todavía construía las pestañas con un spread condicional:

```tsx
...(institutional ? [{ id: 'INSTITUTIONAL', ... }] : [])
```

TypeScript infiere el identificador dentro de ese array como `string`, incompatible con la unión `CertificateTab`. La anotación externa `CertificateTabItem[]` no resuelve esta inferencia interna.

## Solución implementada

Se crea `const tabs: CertificateTabItem[] = []` y se agregan los elementos mediante `tabs.push(...)`. Cada objeto se comprueba directamente contra `CertificateTabItem`, por lo que sus identificadores siguen siendo los literales admitidos.

La navegación MOOC y MDT, la opción institucional, la lógica de capacidades, los permisos, el CSS y el resto de la pantalla no se modifican.

## Archivos completos

1. `components/campus/course-certificates.tsx` — **reemplazar**.
2. `tests/certificate-tabs-typing.test.mjs` — **reemplazar** la prueba del hotfix anterior (si estaba instalada).

## Instrucciones Windows / PowerShell

Extrae el ZIP **en la raíz del frontend** (`C:\proyectosPersonales\LMSBasicG-frontend`) conservando las carpetas y sobrescribiendo ambos archivos.

Comprueba primero la validación de TypeScript sin esperar el build Docker:

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

Solo cuando estos comandos terminen bien, reconstruye:

```powershell
docker compose up -d --build
```

Si `npm run typecheck` señala otro error en un archivo distinto, ese nuevo error no es equivalente al problema de las pestañas: comparte su mensaje completo para corregirlo sin suposiciones.

## Validación efectuada al generar el ZIP

- **121/121 pruebas** del frontend reconstruido con los parches anteriores: aprobadas.
- Compilación de **la construcción real de `tabs` con TypeScript `tsc --strict --noEmit` en una prueba aislada**: aprobada.
- **Build completo `next build` no verificado**: la instalación de dependencias npm no se completó en este entorno. El frontend original y otros archivos conservan sus implementaciones sin cambios.

No requiere backend, migración Alembic, instalación de paquetes nuevos ni modificaciones de Dockerfile.
