import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildTenant, tenantCssVars } from "../lib/tenant/branding.ts";

const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i+2), 16) / 255);
const luminance = hex => {
  const [r,g,b] = rgb(hex).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126*r + .7152*g + .0722*b;
};
const contrast = (a,b) => {
  const [x,y] = [luminance(a),luminance(b)].sort((a,b) => b-a);
  return (x+.05)/(y+.05);
};
const fixture = (primary, hover=primary) => ({
  id: 1, name: "Academia de prueba", matched_domain: "academia.com",
  tenant_domain: "academia.com", landing_domain: null, logo_url: null,
  matched_domain_type: "TENANT", branding_config: { colors: { primary, primary_hover:hover } },
});

test("acento, sidebar y texto de botones cumplen contraste mínimo con paletas extremas", () => {
  for (const primary of ["#FFFFFF", "#FFFF00", "#000000", "#777777", "#1D4ED8", "#E11D48", "#16A34A", "#FFAA00", "#9D00FF", "#D4B7D8"]) {
    const { theme } = buildTenant(fixture(primary, "#F9F9F9"));
    assert.ok(contrast(theme.sidebar, "#FFFFFF") >= 7, `${primary}: sidebar`);
    assert.ok(contrast(theme.accentInk, "#FFFFFF") >= 4.5, `${primary}: acento`);
    assert.ok(contrast(theme.primary, theme.onPrimary) >= 4.5, `${primary}: texto primario`);
    assert.ok(contrast(theme.primaryHover, theme.onPrimaryHover) >= 4.5, `${primary}: texto hover`);
  }
});

test("campus y formulario tienen una sola fuente de identidad visual", () => {
  assert.match(css, /\.lms-sidebar\{[^}]*background:var\(--tenant-sidebar\)/);
  assert.match(css, /\.lms-course-create-header\{[^}]*background:var\(--tenant-primary\);color:var\(--tenant-on-primary\)/);
  assert.match(css, /\.lms-course-create-preview\{[^}]*background:var\(--lms-brand-tint\)/);
  assert.match(css, /\.lms-nav-item\.lms-nav-selected\{[^}]*var\(--tenant-accent-ink\)/);
  assert.doesNotMatch(css, /background:#12385f|#f18b37/i);
  assert.match(css, /\.lms-users-state-on\{[^}]*#dcfce7/);
  assert.match(css, /\.lms-users-danger-icon/);
  assert.equal(tenantCssVars(buildTenant(fixture("#1D4ED8")).theme)["--tenant-primary"], "#1D4ED8");
});
