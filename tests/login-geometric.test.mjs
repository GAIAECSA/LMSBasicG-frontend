import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL('../'+p, import.meta.url), 'utf8');
const form = read('components/auth/login-form.tsx');
const css = read('components/auth/login-form.module.css');
test('login importa su CSS Module y todas las clases referenciadas existen', () => {
  assert.match(form, /import styles from "\.\/login-form\.module\.css"/);
  for (const [, name] of form.matchAll(/styles\.(\w+)/g)) assert.match(css, new RegExp('\\.'+name+'(?![\\w-])'));
  assert.doesNotMatch(form, /className="auth-(window|art|geometry)/);
});
test('geometría separada del formulario y adaptable a móvil', () => {
  assert.match(form, /className=\{styles\.geometry\} aria-hidden="true"/);
  assert.match(css, /\.geometry\s*\{[^}]*pointer-events:\s*none/);
  assert.match(css, /\.geometry\s*\{[^}]*overflow:\s*hidden/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /\.layout\s*\{\s*grid-template-columns:\s*minmax\(0, 540px\)/);
});
test('login conserva identidad y notifica fallos repetidos sin banners', () => {
  assert.match(form, /<BrandLogo name=\{tenant.name\} logoUrl=\{tenant.logoUrl\}/);
  assert.match(form, /notify\(error instanceof Error[^\n]*"error"\)/);
  assert.match(css, /var\(--tenant-primary,/);
  assert.match(css, /var\(--tenant-on-primary,/);
  assert.match(form, /fetch\("\/api\/auth\/login"/);
  assert.match(form, /data\.requiresPolicies\?"\/policies":"\/campus"/);
});
