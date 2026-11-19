import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {join} from 'node:path';
const root = process.cwd();
const source = (path) => readFileSync(join(root, path), 'utf8');
const require = createRequire(import.meta.url);
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');

// Compila las funciones de validación a CommonJS, con la API oficial de TypeScript,
// para probar su comportamiento sin instalar paquetes ni requerir FastAPI.
const typesFile = source('lib/users/types.ts');
const js = ts.transpileModule(typesFile, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
const exports = {};
new Function('exports', js)(exports);

const validUser = {
  id: 12, business_id: 33, role_id: 2, username: 'lmartinez', firstname: 'Lucía',
  lastname: 'Martínez', idnumber: null, email: 'lucia@example.org', phone_number: null,
  province: null, is_active: true, role: {id: 2, code: 'VISITOR', scope: 'PLATFORM', name: 'Visitante'}
};
const create = {
  username:'lmartinez', firstname:'Lucía', lastname:'Martínez', password:'suficiente-123',
  idnumber:null, email:null, phone_number:null, province:null, role_code:'VISITOR'
};

test('el parseo de usuarios impide cruce de tenant y roles COURSE', () => {
  assert.ok(exports.parseUser(validUser, 33));
  assert.equal(exports.parseUser(validUser, 34), null);
  assert.equal(exports.parseUser({...validUser, role:{...validUser.role, scope:'COURSE'}}, 33), null);
  assert.equal(exports.parseUser({...validUser, role:{...validUser.role, code:'STUDENT'}}, 33), null);
  assert.equal(exports.parseUsers([validUser, {...validUser, business_id:34}],33),null);
});

test('creación permite ADMIN/VISITOR y excluye COURSE, contraseña corta y campos arbitrarios', () => {
  assert.equal(exports.validCreateUser(create), true);
  assert.equal(exports.validCreateUser({...create,role_code:'ADMIN'}),true);
  assert.equal(exports.validCreateUser({...create,role_code:'TEACHER'}),false);
  assert.equal(exports.validCreateUser({...create,password:'corta'}),false);
  assert.equal(exports.validCreateUser({...create,business_id:10}),false);
  assert.equal(exports.validCreateUser({...create,role_id:1}),false);
});

test('edición impide cambiar contraseñas y tenant desde el BFF', () => {
  assert.equal(exports.validUpdateUser({firstname:'María',is_active:false}),true);
  assert.equal(exports.validUpdateUser({password:'nuevo-password'}),false);
  assert.equal(exports.validUpdateUser({business_id:2}),false);
  assert.equal(exports.validUpdateUser({role_code:'STUDENT'}),false);
});

test('modo backend antiguo descarta role_code explícitamente', () => {
  assert.equal('role_code' in exports.legacyCreatePayload(create), false);
  assert.equal('role_code' in exports.legacyUpdatePayload({firstname:'Ana',role_code:'ADMIN'}), false);
});

test('página y BFF solo para admin, con políticas obligatorias', () => {
  const page=source('app/campus/users/page.tsx');
  const guard=source('lib/users/route-guard.ts');
  assert.match(page,/isTenantAdmin\(state\.user\.role\)/);
  assert.match(page,/redirect\("\/policies"\)/);
  assert.match(guard,/authState\(await resolveTenant\(\), token\)/);
  assert.match(guard,/isTenantAdmin\(state\.user\.role\)/);
  assert.match(guard,/sameOriginRequest\(request\)/);
  assert.match(guard,/maxBytes/);
});

test('menú para admin presenta Usuarios sin Docentes ni Estudiantes', () => {
  const menu=source('components/campus/campus-shell.tsx');
  assert.match(menu,/\{admin && <>/);
  assert.match(menu,/href="\/campus\/users"/);
  assert.doesNotMatch(menu,/>Docentes</);
  assert.doesNotMatch(menu,/>Estudiantes</);
});

test('restringe asignación ADMIN hasta instalar backend compatible', () => {
  const backend=source('app/api/users/route.ts');
  const toggle=source('lib/users/permissions.ts');
  assert.match(toggle,/ATHENA_USERS_ROLE_ASSIGNMENT/);
  assert.match(backend,/input\.role_code === "ADMIN" && !canAssignPlatformRoles\(\)/);
  assert.match(backend,/user\.role\.code !== input\.role_code/);
});

test('supresión de usuarios usa DELETE y bloqueo de autoeliminación', () => {
  const detail=source('app/api/users/[userId]/route.ts');
  assert.match(detail,/export async function DELETE\(/);
  assert.match(detail,/userId === context\.currentUserId/);
  assert.match(detail,/\/api\/v1\/users\/\$\{userId\}/);
});
