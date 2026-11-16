# Portada pública: diseño original restaurado y branding multi-tenant

## Fuente de diseño

Archivo de referencia: `LMSBasicG-frontend-mdtbranch/components/courses/public-courses-view.tsx` del frontend original adjuntado por el usuario. Captura de referencia: el encabezado blanco, logo/nombre a la izquierda, navegación central, botón de inicio de sesión a la derecha, hero con título enorme a la izquierda, curso destacado a la derecha, tres tarjetas y grilla inferior.

No se recuperaron componentes internos obsoletos ni contratos de API del frontend antiguo. El único componente de presentación adaptado está en `components/public/home-client.tsx`.

## Mapa de secciones que conserva la apariencia

| Zona | Fuente de datos | Conservado / variación intencional |
|---|---|---|
| Encabezado | `businesses.logo_url`, `businesses.name` | Misma geometría sticky y logo redondeado; «Sobre ATHENA» eliminado. |
| Hero | `branding_config.content.hero`, defaults seguros | Tamaños originales, salto de línea del título «Aprende con ...», botón de catálogo y acceso al login. |
| Banda inferior al hero | Largo real de `courses` | Mismas cuatro burbujas decorativas; número de alumnos ficticio reemplazado por cursos reales. |
| Curso destacado | `/api/v1/courses/public/landing` | Misma tarjeta, imagen, precio, duración, badge y rotación (4,5 s). Corazón decorativo, sin funcionalidad de favoritos aún. |
| Tarjetas de tres beneficios | Catálogo, acceso y recursos | Mismo layout; textos genéricos para no prometer 100% de modalidad. |
| Catálogo | Cursos públicos ya filtrados por backend | Misma grilla, buscador, filtro de nivel, foto, precio y descuentos. |

## Contrato JSONB

La fuente de identidad es `businesses` (`name` y `logo_url` separados de `branding_config`):

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

Los campos pueden omitirse. En ese caso se usan defaults del frontend. Nunca se coloca el nombre/logo de ATHENA como fallback de una academia.

## Dónde modificar el diseño / branding

- **Textos y colores por academia:** datos de `businesses` administrados por el backend existente; no editar JSX de forma diferente para cada academia.
- **Validación y configuración predeterminada:** `lib/tenant/branding.ts` (colores HEX, contraste en botones, textos escapados por React).
- **CSS dinámico y Tailwind:** `app/globals.css` (`@theme inline` mapea clases `blue-700`, etc.). El layout inyecta variables CSS distintas por request.
- **Composición de la portada:** `components/public/home-client.tsx`. No cambiar la jerarquía ni los breakpoints si se pretende conservar el diseño original.
- **Datos y seguridad:** `app/page.tsx`, `lib/tenant/resolve.ts` y `lib/courses.ts` (SSR por Host, sin caché compartida de tenants).

## Qué no se ha hecho

No existe editor visual de branding ni registro abierto; tampoco se migraron las pantallas internas del LMS original. El backend **no** se modificó. Se requiere en producción un endpoint administrativo seguro para editar `branding_config`, si el administrador debe personalizar sin intervención técnica.

## Aceptación visual recomendada

Comparar en un navegador real la captura original con una academia configurada con la paleta azul predeterminada, misma resolución y mismas imágenes de cursos. Revisar desktop y móvil, luego repetir con un segundo tenant de paleta diferente. Este paso no pudo automatizarse en el entorno de trabajo al no disponer de dependencias npm instaladas.
