# Bitácora de arquitectura — Frontend multi-tenant (fase 1)

**Regla del proyecto:** registrar aquí todo cambio relevante indicando **qué, cómo y por qué**. Mantener comentarios técnicos en puntos de seguridad, tenancy, cache y despliegue. No documentar cada línea trivial.

## 2026-11-16 — Creación de base nueva

| Qué se hizo | Cómo se hizo | Por qué se hizo |
|---|---|---|
| Se creó un Next.js limpio | Se conservaron únicamente dependencias Next, React, iconos y herramientas TypeScript/ESLint. Se descartaron carpetas legacy, archivos de experimentos, assets ATHENA, URLs IP hardcodeadas y módulos aún no migrados. | Evitar arrastrar contratos y estilos incompatibles con el backend refactorizado. |
| Se implementó resolución real por dominio | `lib/tenant/resolve.ts` obtiene el `Host` original del proxy en el servidor y llama a `/api/v1/tenant/resolve`. Verifica `matched_domain`, `matched_domain_type=TENANT` y `tenant_domain`, no habilita dominio predeterminado y usa `cache: no-store`. | Un despliegue para múltiples dominios, sin riesgo de mostrar la marca equivocada por caché global. |
| Se definió esquema de branding | `lib/tenant/branding.ts` interpreta `branding_config.colors` y `content.hero`, valida HEX, deriva variantes de un color primario opcional y limita la longitud de texto. Inyecta variables CSS desde `app/layout.tsx` en cada petición. | Permitir colores/texto por academia sin recompilar Tailwind ni añadir HTML arbitrario. |
| Se actualizó la portada | `app/page.tsx` carga tenant + cursos por `tenant_domain`, y `components/public/home-client.tsx` muestra logo, nombre, título y catálogo. | La portada es un LMS público, no una landing institucional. |
| Se retiró «Sobre ATHENA» | No se trasladó la página institucional, enlaces promocionales, imagen/logotipo de ATHENA ni las cifras fijas de alumnos. | Evitar presentar la marca del proveedor como identidad de una academia. |
| Se corrigió la integración de cursos | Se consulta `/api/v1/courses/public/landing?domain=...`, con DTO público real y sin filtro cliente de campos inexistentes. | El backend refactorizado cambió endpoints y formato de la respuesta. |
| Se implementó autenticación mínima | `/api/auth/login`, `/api/auth/session`, `/api/auth/logout` actúan como BFF y emiten cookies host-only HttpOnly. `/campus` es una pantalla sencilla de sesión. | Probar el acceso sin depender de `localStorage` ni exponer el JWT al navegador; los módulos internos se migrarán después. |
| Se preparó Docker reproducible | `Dockerfile` multi-stage standalone, `compose.yaml`, proxy Nginx compartido, `.env.example`, healthcheck y ejemplo de TLS externo. | Hacer un único despliegue con múltiples dominios, sin otro contenedor por academia. |
| Se documentó el contrato y próximos pasos | `README.md`, `docs/CONTRATO_BACKEND.md`, `docs/DESPLIEGUE.md`, bitácora y comentarios de código. | Evitar perder las razones arquitectónicas durante la siguiente refactorización. |

## Contrato inicial de `branding_config`

```json
{
  "version": 1,
  "colors": {
    "primary": "#1D4ED8",
    "primary_hover": "#1E40AF",
    "primary_soft": "#DBEAFE",
    "background": "#F7FAFF",
    "surface": "#FFFFFF",
    "text": "#0F172A"
  },
  "content": {
    "hero": {
      "eyebrow": "SISTEMA VIRTUAL DE APRENDIZAJE",
      "title": "Aprende con Academia Ejemplo",
      "description": "Explora los cursos disponibles y continúa tu formación profesional.",
      "cta_text": "Explorar cursos"
    }
  }
}
```

Los campos `businesses.name` y `businesses.logo_url` siguen siendo fuente única. Si `branding_config` es `{}`, se usan colores y frases genéricas, **nunca la marca ATHENA**.

## Límite explícito de esta fase

Esta entrega cubre **portada pública, catálogo, identificación del tenant, marca, autenticación básica y despliegue**. No declara migrados los módulos de estudiantes, docentes y administradores. El backend fue consultado para conocer contratos, **sin tocar sus archivos**.

## Verificación y límites de entrega

- Pruebas de branding y host: 4 aprobadas con Node 22, comando `npm test`.
- Inspección de sintaxis de 22 archivos TS/TSX: aprobada.
- Lockfile regenerado en modo offline para remover paquetes y referencias viejos.
- Pendiente compilación real y pruebas Docker/HTTPS contra API activa; el entorno no tuvo acceso a registry.npmjs.org ni ejecutables Docker/Nginx. Se deja constancia en `docs/VERIFICACION.md`.
