import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { isTenantAdmin } from "../lib/policies/types.ts";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("el inicio del campus no muestra la tarjeta provisional ni Llegaste", () => {
  const client = read("components/auth/campus-client.tsx");
  const home = read("components/campus/campus-home.tsx");
  const css = read("app/globals.css");
  assert.match(client, /<CampusShell/);
  assert.match(client, /<CampusHome/);
  assert.doesNotMatch(client + home, /Llegaste|lms-arrived|Ingresaste correctamente/);
  assert.doesNotMatch(css, /\.lms-arrived\{/);
});

test("la portada del campus tiene únicamente accesos a rutas existentes", () => {
  const home = read("components/campus/campus-home.tsx");
  const links = [...home.matchAll(/<Link\s+href="([^"]+)"/g)].map(v=>v[1]);
  assert.deepEqual(links, ["/campus/users", "/campus/policies", "/"]);
  assert.match(read("app/campus/users/page.tsx"), /isTenantAdmin\(state\.user\.role\)/);
  assert.match(read("app/campus/policies/page.tsx"), /authState\(tenant\)/);
});

test("el menú contextual mantiene Administración o Información según el rol", () => {
  const shell = read("components/campus/campus-shell.tsx");
  assert.match(shell, /isTenantAdmin\(user\.role\)/);
  assert.match(shell, /"Administración":"Información"/);
  assert.match(shell, /href="\/campus\/policies"/);
  assert.equal(isTenantAdmin({code:"ADMIN",scope:"PLATFORM"}), true);
  assert.equal(isTenantAdmin({code:"STUDENT",scope:"COURSE"}), false);
});

test("el contenido del inicio viene de la sesión validada y los módulos reales", () => {
  const page=read("app/campus/page.tsx");
  const client=read("components/auth/campus-client.tsx");
  const home=read("components/campus/campus-home.tsx");
  assert.match(page, /authState\(tenant\)/);
  assert.match(page, /redirect\("\/login"\)/);
  assert.match(page, /redirect\("\/policies"\)/);
  assert.match(page, /modules=\{state\.modules\}/);
  assert.match(client, /modules=\{modules\}/);
  assert.match(home, /modules\.map\(/);
  assert.match(home, /user\.role\.name/);
  assert.doesNotMatch(home, /fake|mock|Math\.random|2,500/);
});
