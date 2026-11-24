import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseAdminPolicies, parseVersions, parseCurrentPolicies, parseAcceptedHistory,
  currentVersion, isTenantAdmin } from "../lib/policies/types.ts";

import { allowedLmsRole } from "../lib/auth/types.ts";

const read = path => readFileSync(new URL(`../${path}`,import.meta.url),"utf8");
const now="2026-11-18T17:00:00Z";
function version(id, date, published=true) {return {id,policy_id:4,version:String(id),title:"Privacidad",
  content_format:"HTML",effective_at:date,published_at:now,content_sha256:null,is_published:published};}

test("solo ADMIN/PLATFORM accede a las acciones de administración",()=>{
  assert.equal(isTenantAdmin({code:"ADMIN",scope:"PLATFORM"}),true);
  assert.equal(isTenantAdmin({code:"STUDENT",scope:"COURSE"}),false);
  assert.equal(isTenantAdmin({code:"ADMIN",scope:"COURSE"}),false);
  assert.equal(isTenantAdmin({code:"TEACHER",scope:"PLATFORM"}),false);
  assert.equal(allowedLmsRole({code:"STUDENT",scope:"COURSE"}),true);
  assert.equal(allowedLmsRole({code:"TEACHER",scope:"COURSE"}),true);
  assert.equal(allowedLmsRole({code:"ADMIN",scope:"COURSE"}),false);
  assert.match(read("lib/policies/route-guard.ts"),/authState\(tenant,token\)/);
  assert.match(read("lib/policies/route-guard.ts"),/isTenantAdmin\(state.user.role\)/);
});
test("solo una versión resulta vigente, las anteriores siguen auditables",()=>{
  const rows=[version(11,"2026-02-01T00:00:00Z"),version(12,"2026-08-01T00:00:00Z"),
    version(13,"2028-02-01T00:00:00Z")];
  assert.equal(currentVersion(rows,Date.parse(now))?.id,12);
  assert.equal(rows.filter(v=>v.is_published).length,3);
  assert.equal(currentVersion(rows,Date.parse("2026-01-01T00:00:00Z")),undefined);
  assert.equal(currentVersion(rows.map(v=>({...v,is_published:false})),Date.parse(now)),undefined);
});
test("contratos de API rechazan versiones/políticas incoherentes",()=>{
  assert.deepEqual(parseAdminPolicies([{id:4,title:"Privacidad",code:"privacy",mandatory:true,is_active:true}])?.[0].id,4);
  assert.equal(parseAdminPolicies([{id:4,title:"Externa",code:"privacy",mandatory:"yes",is_active:true}]),null);
  assert.equal(parseVersions([version(11,"2026-02-01T00:00:00Z")],8),null); // Historial ajeno
  assert.equal(parseVersions([version(11,"2026-02-01T00:00:00Z")],4)?.length,1);
  assert.equal(parseCurrentPolicies([{policy_id:4,version_id:11,provider:"CLIENT",code:"privacy",title:"Privacidad",
    version:"1.0",content_format:"HTML",effective_at:now,mandatory:false,accepted:false,accepted_at:null,needs_acceptance:false}])?.length,1);
  assert.equal(parseAcceptedHistory([{policy_id:4,version_id:11,provider:"ATHENA",code:"privacy",version:"1.0",
    title:"Privacidad",accepted_at:now}])?.length,1);
});
test("no hay edición, borrado ni endpoints de cancelación en el módulo",()=>{
  const admin=read("components/campus/admin-policies.tsx");
  assert.doesNotMatch(admin,/method:\s*["'](?:PATCH|DELETE|PUT)["']/);
  assert.doesNotMatch(admin,/fetch\([^\n]*\/cancel/);
  assert.match(admin,/versions\/\$\{format.toLowerCase\(\)\}/);
  assert.match(read("lib/policies/backend.ts"),/\/api\/v1\/policies\/admin\/\$\{policy.id\}\/versions/);
});
test("el visor no abre el almacenamiento privado y el estudiante no consume API de admin",()=>{
  const reader=read("components/campus/policy-viewer.tsx");
  assert.match(reader,/iframe/);
  assert.match(reader,/sandbox/);
  assert.doesNotMatch(reader,/\/private-files\//);
  assert.doesNotMatch(read("components/campus/my-policies.tsx"),/\/api\/policies\/admin/);
  for (const path of ["app/api/policies/admin/route.ts", "app/api/policies/admin/catalog/route.ts",
    "app/api/policies/admin/[policyId]/versions/html/route.ts", "app/api/policies/admin/[policyId]/versions/pdf/route.ts"])
    assert.ok(existsSync(new URL(`../${path}`,import.meta.url)),`falta ${path}`);
});
