import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("se preserva la composición visual de la portada del LMS original", () => {
  const source = read("components/public/home-client.tsx");
  for (const landmark of ["athena-public-header", "athena-hero-layout", "athena-hero-kicker", "athena-feature-frame", "athena-feature-content", "athena-routes", "athena-route-card", "athena-courses"]) {
    assert.ok(source.includes(landmark), `${landmark} debe conservarse`);
  }
  assert.ok(source.includes("max-w-[1480px]"));
  assert.ok(source.includes("max-width: 760px"));
  assert.ok(source.includes("sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"));
});

test("la portada no usa marca fija ni afirmaciones promocionales obsoletas", () => {
  const source = read("components/public/home-client.tsx");
  assert.ok(!source.includes("Sobre ATHENA"));
  assert.ok(!source.includes('href="/athena"'));
  assert.ok(!source.includes("+2,500 estudiantes"));
  assert.ok(!source.includes("100% Online"));
  assert.ok(!source.includes("NEXT_PUBLIC_BUSINESS_DOMAIN"));
  assert.ok(source.includes("tenant.name"));
  assert.ok(source.includes("tenant.hero.title"));
  assert.ok(source.includes("tenant.logoUrl"));
});

test("el esquema cromático de la portada se resuelve sin rebuild por academia", () => {
  const css = read("app/globals.css");
  assert.ok(css.startsWith('@import "tailwindcss";'));
  assert.match(css, /--color-blue-700:\s*var\(--tenant-primary\)/);
  assert.match(css, /--color-blue-800:\s*var\(--tenant-primary-hover\)/);
  assert.match(css, /--color-blue-100:\s*var\(--tenant-primary-soft\)/);
  assert.match(css, /\.tenant-header-shadow/);
  const postcss = read("postcss.config.mjs");
  assert.ok(postcss.includes('@tailwindcss/postcss'));
});

test("lockfile declara los paquetes de Tailwind requeridos por Docker", () => {
  const pkg = JSON.parse(read("package.json"));
  const lock = JSON.parse(read("package-lock.json"));
  for (const name of ["next", "react", "react-dom", "tailwindcss", "@tailwindcss/postcss"]) {
    const field = pkg.dependencies[name] ? "dependencies" : "devDependencies";
    assert.equal(pkg[field][name], lock.packages[""][field][name]);
    assert.ok(lock.packages[`node_modules/${name}`]);
  }
});
