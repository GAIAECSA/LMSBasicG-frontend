import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePendingPolicies, parseModules, validUser} from '../lib/auth/types.ts';
const f = (p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('reconoce políticas pendientes HTML/PDF y rechaza formatos ajenos',()=>{
  const p={policy_id:2,code:'terminos',title:'Términos',provider:'CLIENT',version_id:14,version:'1.0',content_format:'HTML',mandatory:true,needs_acceptance:true};
  assert.equal(parsePendingPolicies([p])[0].version_id,14);
  assert.equal(parsePendingPolicies([{...p,content_format:'PDF'}])[0].content_format,'PDF');
  assert.equal(parsePendingPolicies([{...p,content_format:'JS'}]),null);
  assert.equal(parsePendingPolicies([{...p,needs_acceptance:false}]),null);
});
test('reconoce config habilitada sin asumir ID de módulo',()=>{
  assert.deepEqual(parseModules([{id:33,code:'MDT',name:'MDT',description:null,config:{foo:true}}])[0].config,{foo:true});
  assert.equal(parseModules([{id:1,code:'X',name:'X',config:[]}]),null);
});
test('roles por code/scope, no por ID hardcodeado',()=>{
 const a={id:1,role_id:45,business_id:2,firstname:'A',lastname:'B',username:'a',role:{id:45,code:'ADMIN',scope:'PLATFORM',name:'Admin'}};
 assert.ok(validUser(a));assert.ok(!validUser({...a,role:null}));
});
test('no existe registro ni refresh ficticio, revocación real',()=>{
 assert.match(f('app/api/auth/logout/route.ts'),/api\/v1\/auth\/logout/);
 assert.doesNotMatch(f('components/auth/login-form.tsx'),/\/register|\/registro/);
 assert.match(f('lib/auth/server.ts'),/policies\/pending/);
 assert.match(f('lib/auth/server.ts'),/business-lms-config\/me\/modules/);
 assert.match(f('components/auth/policy-wizard.tsx'),/No acepto, cerrar sesión/);
});
test('aislamiento por tenant y protección CSRF en acciones',()=>{
 assert.match(f('app/api/auth/login/route.ts'),/domain:tenant.tenantDomain/);
 assert.match(f('lib/auth/server.ts'),/claims.businessId !== tenant.id/);
 assert.match(f('app/api/policies/versions/[versionId]/accept/route.ts'),/sameOriginRequest/);
 assert.match(f('app/api/auth/logout/route.ts'),/sameOriginRequest/);
});
