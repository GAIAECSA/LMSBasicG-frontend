# Diseño y branding multi-tenant — Athena (portada y campus)

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


---

## 19/11/2026 — Estandarización visual del campus (Fase 6.2)

**Esta sección es normativa para las siguientes pantallas de Athena.** Se añadió
para evitar que el sidebar, los encabezados de modales y los componentes futuros
utilicen paletas institucionales diferentes en un mismo tenant. Conservar junto
con este documento el contrato de `businesses.branding_config` descrito arriba.

### Origen de los colores y alcance

- **Única fuente institucional:** `businesses.branding_config.colors` del tenant
  resuelto en servidor por el hostname. El objeto actual mantiene las seis claves
  originales `primary`, `primary_hover`, `primary_soft`, `background`, `surface`, `text`;
  **no hay columnas nuevas ni cambios al backend**.
- `lib/tenant/branding.ts` valida los colores HEX, define los valores por defecto y
  calcula tokens legibles. `app/layout.tsx` inyecta esos tokens con `tenantCssVars()`
  en el `<body>` de cada solicitud SSR. No usar `localStorage`, valores por dominio
  hardcodeados ni CSS por academia.
- `app/globals.css` define los estilos semánticos de interfaz, mientras los componentes
  (`components/campus/*` y `components/public/*`) consumen las clases existentes.
  Las clases `blue-*` del diseño público continúan mapeadas con Tailwind `@theme inline`.

### Tokens visuales

| Variable CSS | Papel y criterio |
|---|---|
| `--tenant-primary` | Fondo de acciones principales y encabezados institucionales (ej. «Crear curso»). |
| `--tenant-primary-hover` | Fondo del botón principal al pasar el cursor. |
| `--tenant-on-primary` | Texto/íconos con contraste sobre `primary`, calculado por servidor. |
| `--tenant-on-primary-hover` | Texto/íconos legibles sobre `primary_hover`. |
| `--tenant-primary-soft` | Matiz suave proporcionado por el negocio para la portada y detalles ligeros. |
| `--tenant-accent-ink` | Variante del primario oscurecida si hace falta hasta contrastar al menos 4.5:1 con blanco; usada en texto/iconos sobre tarjetas del campus. |
| `--tenant-sidebar` | Variante **oscura del primario**, ajustada para un contraste de al menos 7:1 con texto blanco. |
| `--tenant-background`, `--tenant-surface`, `--tenant-text` | Fondo, superficie y texto de la identidad pública. |
| `--lms-accent-ink`, `--lms-brand-tint`, `--lms-brand-border` | Tokens de presentación **locales a `.lms-shell`**, derivados de los tokens anteriores. |

### Reglas obligatorias

1. **Un solo color institucional por tenant:** el sidebar (`--tenant-sidebar`), el encabezado del formulario de cursos (`--tenant-primary`), los CTA, iconos y focos se derivan de la **misma** paleta, no de azules/naranjas/púrpuras arbitrarios.
2. **Contraste antes que fidelidad exacta:** `onPrimary`, `onPrimaryHover`, `accentInk` y `sidebar` se calculan para texto legible. Los usuarios con colores claros siguen teniendo textos oscuros sobre los botones institucionales y texto blanco sobre su sidebar más oscuro.
3. **Superficies neutrales por defecto:** tablas, formularios, paneles, modales y campos se mantienen blancos o grises suaves; no colorear la zona de trabajo de forma masiva. El fondo exterior del campus puede seguir `--tenant-background`.
4. **Estado ≠ identidad:** éxito/publicado/activo en verde, advertencia/borrador en ámbar, peligro/eliminar en rojo. Son colores **semánticos compartidos**, NO colores derivados del tenant. Los badges de tipo o nivel pueden usar matices institucionales/neutros.
5. **No codificar colores en JSX** ni añadir otro degradado fijo en una pantalla nueva. Preferir las clases existentes o tokens semánticos. Los colores HEX neutrales o semánticos de estado sí son admisibles en CSS.
6. **No alterar flujos ni datos:** la estandarización afecta solo la presentación, el cálculo de tokens en el servidor y pruebas. No cambia rutas, autorización, formularios, cookies, imágenes ni API.
7. **Evitar conflictos:** el diseño público conserva su disposición original; el campus usa los tokens `.lms-shell`. No modificar el marcado de la portada pública solo para cambiar el color de la administración.

### Ubicación de las modificaciones de esta fase

- `lib/tenant/types.ts`: añade `onPrimaryHover`, `accentInk`, `sidebar` al tema.
- `lib/tenant/branding.ts`: deriva esos valores con razón de contraste WCAG y los exporta a variables CSS.
- `app/globals.css`: sidebar institucional con selección de alto contraste, encabezado del formulario de cursos sin degradado arbitrario, vista previa/tarjetas/acento alineados con branding. Conserva los estilos de estado independientes.
- `tests/tenant.test.mjs` y `tests/branding-campus.test.mjs`: protegen el comportamiento entre tenants y las reglas de colores institucionales.

### Lista de verificación para futuras fases

- Probar **dos tenants con primarios diferentes** (por ejemplo, azul y rojo) y un **tenant con primario muy claro** (`#FFFFFF` o amarillo), sin reiniciar ni recompilar el frontend.
- Revisar el sidebar normal, seleccionado, submenú y móvil; el modal de creación de curso; la portada pública; acciones primarias y sus hover; y estados de error/aviso/publicado.
- Verificar que texto/botones sean legibles tanto sobre primarios oscuros como claros, que las superficies sigan neutras y que los controles tengan foco visible.
- Ejecutar `npm test`, `npm run typecheck` y `npm run build`; contrastar además en el navegador a tamaños escritorio/móvil. Las pruebas de código no reemplazan la validación visual.

**Nota de compatibilidad:** los nuevos campos de `TenantTheme` son derivados en el frontend; no se agregan claves obligatorias a `branding_config` ni cambia su schema JSONB.
