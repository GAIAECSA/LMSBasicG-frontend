import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("la ruta /campus verifica la sesion y redirige solo si hay pendientes", () => {
  const page = read("app/campus/page.tsx");
  assert.match(page,/authState\(tenant\)/);
  assert.match(page,/state\.status === "pending"/);
  assert.match(page,/redirect\("\/policies"\)/);
  assert.match(page,/CampusClient/);
});
test("login envia directamente a campus cuando policies/pending esta vacio", () => {
  const login = read("app/api/auth/login/route.ts");
  const form = read("components/auth/login-form.tsx");
  const backend = read("lib/auth/server.ts");
  assert.match(login,/requiresPolicies:pending\.length>0/);
  assert.match(form,/data\.requiresPolicies\?"\/policies":"\/campus"/);
  assert.match(backend,/if \(pending\.length\) return \{status:"pending"/);
});
test("no queda el viejo mensaje post-login ni Llegaste", () => {
  const client = read("components/auth/campus-client.tsx");
  const home = read("components/campus/campus-home.tsx");
  assert.doesNotMatch(client+home,/La portada y autenticación multi-tenant ya están listas|Hola, \{|Ingresaste correctamente|Llegaste/);
  assert.match(client,/<CampusShell/);
  assert.match(client,/<CampusHome/);
});
test("el admin y los otros roles usan el mismo shell con menu contextual",()=>{
  const shell = read("components/campus/campus-shell.tsx");
  const policies = read("app/campus/policies/page.tsx");
  assert.match(shell,/admin\?"Administración":"Información"/);
  assert.match(shell,/href="\/campus\/policies"/);
  assert.match(policies,/isTenantAdmin\(state\.user\.role\)/);
});
