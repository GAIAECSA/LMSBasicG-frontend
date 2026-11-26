import type { TenantHero, TenantPublic, TenantResponse, TenantTheme } from "./types";

const DEFAULT_THEME: Omit<TenantTheme, "onPrimary" | "onPrimaryHover" | "accentInk" | "sidebar"> = {
  primary: "#1D4ED8",
  primaryHover: "#1E40AF",
  primarySoft: "#DBEAFE",
  background: "#F7FAFF",
  surface: "#FFFFFF",
  text: "#0F172A",
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>) : {};
}

function color(value: unknown, fallback: string): string {
  // Solo #RGB o #RRGGBB; no se permite inyectar CSS arbitrario desde JSONB.
  if (typeof value !== "string" || !/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(value)) return fallback;
  const hex = value.toUpperCase();
  return hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
}

function blend(hex: string, target: "#000000" | "#FFFFFF", weight: number): string {
  const rgb = [1, 3, 5].map((index) => {
    const initial = parseInt(hex.slice(index, index + 2), 16);
    const final = target === "#FFFFFF" ? 255 : 0;
    return Math.round(initial * (1 - weight) + final * weight).toString(16).padStart(2, "0");
  });
  return `#${rgb.join("")}`.toUpperCase();
}

/** Contraste WCAG de dos colores HEX normalizados. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function contrast(a: string, b: string): number {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

function readableOn(hex: string): string {
  // El gris pizarra institucional no siempre llega a 4.5:1 sobre colores medios.
  // Negro/blanco permiten garantizar contraste incluso cerca de ese umbral.
  const dark = "#0F172A", light = "#FFFFFF";
  if (contrast(hex, dark) >= 4.5 && contrast(hex, dark) >= contrast(hex, light)) return dark;
  if (contrast(hex, light) >= 4.5) return light;
  return "#000000";
}

function readableAccent(hex: string): string {
  // En campus se emplean superficies neutras blancas. Conserva el tono de la
  // academia y oscurece el acento solo si no es legible sobre blanco.
  let result = hex;
  for (let i = 0; i < 40 && contrast(result, "#FFFFFF") < 4.5; i++) {
    result = blend(result, "#000000", 0.08);
  }
  return result;
}

function sidebarFromPrimary(hex: string): string {
  // Un sidebar de la misma familia cromática, suficientemente oscuro para texto
  // blanco (objetivo 7:1), aun con colores institucionales muy claros.
  let result = blend(hex, "#000000", 0.56);
  for (let i = 0; i < 40 && contrast(result, "#FFFFFF") < 7; i++) {
    result = blend(result, "#000000", 0.08);
  }
  return result;
}

function text(value: unknown, fallback: string, max = 190): string {
  // Sin HTML enriquecido en la portada; React escapará el texto.
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) || fallback;
}

export function buildTenant(response: TenantResponse): TenantPublic {
  const branding = record(response.branding_config);
  const colors = record(branding.colors);
  const content = record(branding.content);
  const hero = record(content.hero);

  const primary = color(colors.primary, DEFAULT_THEME.primary);
  const primaryHover = color(colors.primary_hover, primary === DEFAULT_THEME.primary ? DEFAULT_THEME.primaryHover : blend(primary, "#000000", 0.18));
  const theme: TenantTheme = {
    primary,
    primaryHover,
    primarySoft: color(colors.primary_soft, primary === DEFAULT_THEME.primary ? DEFAULT_THEME.primarySoft : blend(primary, "#FFFFFF", 0.88)),
    background: color(colors.background, DEFAULT_THEME.background),
    surface: color(colors.surface, DEFAULT_THEME.surface),
    text: color(colors.text, DEFAULT_THEME.text),
    onPrimary: readableOn(primary),
    onPrimaryHover: readableOn(primaryHover),
    accentInk: readableAccent(primary),
    sidebar: sidebarFromPrimary(primary),
  };

  const heroContent: TenantHero = {
    eyebrow: text(hero.eyebrow, "SISTEMA VIRTUAL DE APRENDIZAJE", 70),
    title: text(hero.title, `Aprende con ${response.name}`, 120),
    description: text(hero.description, "Explora los cursos disponibles y continúa tu formación profesional.", 300),
    ctaText: text(hero.cta_text, "Explorar cursos", 38),
  };

  // El logo público tiene un endpoint seguro; nunca usar directamente rutas /uploads.
  const candidateLogo = response.logo_url;
  let logoUrl: string | null = null;
  if (typeof candidateLogo === "string" && candidateLogo.startsWith("/api/v1/tenant/logo?")) {
    const params = new URLSearchParams(candidateLogo.split("?")[1]);
    if (params.get("domain") === response.matched_domain) logoUrl = candidateLogo;
  }
  return {
    id: response.id,
    name: text(response.name, "Academia", 100),
    tenantDomain: response.tenant_domain,
    matchedDomain: response.matched_domain,
    logoUrl,
    theme,
    hero: heroContent,
  };
}

export function tenantCssVars(theme: TenantTheme): Record<string, string> {
  return {
    "--tenant-primary": theme.primary,
    "--tenant-primary-hover": theme.primaryHover,
    "--tenant-primary-soft": theme.primarySoft,
    "--tenant-background": theme.background,
    "--tenant-surface": theme.surface,
    "--tenant-text": theme.text,
    "--tenant-on-primary": theme.onPrimary,
    "--tenant-on-primary-hover": theme.onPrimaryHover,
    "--tenant-accent-ink": theme.accentInk,
    "--tenant-sidebar": theme.sidebar,
  };
}
