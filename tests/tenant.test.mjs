import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTenant, tenantCssVars } from "../lib/tenant/branding.ts";
import { normalizeHostname } from "../lib/tenant/hostname.ts";

const fixture = (name, domain, branding = {}, logo = null) => ({
  id: 22, name, tenant_domain: domain, landing_domain: null,
  logo_url: logo, branding_config: branding, matched_domain: domain, matched_domain_type: "TENANT",
});

test("se normaliza hostname sin protocolo ni puerto", () => {
  assert.equal(normalizeHostname("ACADEMIA.COM:443"), "academia.com");
  assert.equal(normalizeHostname("lms.academia.com."), "lms.academia.com");
  assert.equal(normalizeHostname("https://evil.com"), null);
  assert.equal(normalizeHostname("evil.com/path"), null);
  assert.equal(normalizeHostname("acade mia.com"), null);
});

test("branding de academias distintas está aislado", () => {
  const a = buildTenant(fixture("Academia Roja", "roja.com", { colors: { primary: "#e11d48" } }));
  const b = buildTenant(fixture("Academia Verde", "verde.com", { colors: { primary: "#16a34a" } }));
  assert.notEqual(a.theme.primary, b.theme.primary);
  assert.notEqual(a.theme.primaryHover, b.theme.primaryHover);
  assert.notEqual(a.theme.primarySoft, b.theme.primarySoft);
  assert.match(a.hero.title, /Academia Roja/);
  assert.match(b.hero.title, /Academia Verde/);
  assert.equal(tenantCssVars(a.theme)["--tenant-primary"], "#E11D48");
});

test("valores de branding inválidos caen a defaults seguros", () => {
  const business = buildTenant(fixture("Ejemplo", "ejemplo.com", {
    colors: { primary: "red; background:url(bad)", text: "var(--otro)" },
    content: { hero: { title: "", description: 27 } },
  }));
  assert.equal(business.theme.primary, "#1D4ED8");
  assert.equal(business.theme.text, "#0F172A");
  assert.equal(business.hero.title, "Aprende con Ejemplo");
  assert.ok(!JSON.stringify(business).includes("ATHENA"));
});

test("logo solamente admite endpoint del hostname correspondiente", () => {
  const logo = "/api/v1/tenant/logo?domain=uno.com";
  assert.equal(buildTenant(fixture("Uno", "uno.com", {}, logo)).logoUrl, logo);
  assert.equal(buildTenant(fixture("Dos", "dos.com", {}, logo)).logoUrl, null);
  assert.equal(buildTenant(fixture("Dos", "dos.com", {}, "https://example.com/malware.svg")).logoUrl, null);
});
