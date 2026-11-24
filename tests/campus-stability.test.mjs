import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createAsyncTtlCache } from '../lib/tenant/ttl-cache.ts';
import { validTenantForHost } from '../lib/tenant/validation.ts';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('resolución: deduplica solicitudes concurrentes al MISMO hostname', async () => {
  let count = 0, tick = 0;
  const cache = createAsyncTtlCache(20000, 2, () => tick);
  const loader = async () => { count++; await Promise.resolve(); return {tenant:1}; };
  const [a,b] = await Promise.all([cache.get('uno.com',loader),cache.get('uno.com',loader)]);
  assert.equal(count,1);
  assert.equal(a,b);
  await cache.get('uno.com',loader);
  assert.equal(count,1);
  tick=20001;
  await cache.get('uno.com',loader);
  assert.equal(count,2);
});

test('resolución: aísla dominios y NO cachea fallos', async () => {
  const cache = createAsyncTtlCache(1000,4);
  let i=0;
  await assert.rejects(cache.get('a.com',async () => { i++; throw Error('down'); }));
  await assert.rejects(cache.get('a.com',async () => { i++; throw Error('down'); }));
  assert.equal(i,2);
  const a=await cache.get('a.com', async()=>({id:1}));
  const b=await cache.get('b.com', async()=>({id:2}));
  assert.notEqual(a.id,b.id);
  assert.equal((await cache.get('a.com',async()=>({id:99}))).id,1);
});

test('resolución: caché acotada con expulsión LRU', async () => {
  const c=createAsyncTtlCache(5000,2);
  await c.get('a',async()=>1);
  await c.get('b',async()=>2);
  await c.get('a',async()=>100); // a sigue siendo más reciente
  await c.get('c',async()=>3);
  assert.equal(await c.get('b',async()=>22),22); // b fue expulsado
});

test('dominio: un tenant ajeno o landing nunca pasa la validación', () => {
  const row = {id:2,name:'Academia',tenant_domain:'a.com',matched_domain:'a.com',matched_domain_type:'TENANT'};
  assert.ok(validTenantForHost(row,'a.com'));
  assert.equal(validTenantForHost({...row,matched_domain:'b.com'},'a.com'),false);
  assert.equal(validTenantForHost({...row,tenant_domain:'b.com'},'a.com'),false);
  assert.equal(validTenantForHost({...row,matched_domain_type:'LANDING'},'a.com'),false);
  assert.equal(validTenantForHost({...row,id:0},'a.com'),false);
});

test('sidebar: toggle real, preferencia por tenant y CSS responsive', () => {
  const shell=read('components/campus/campus-shell.tsx');
  const css=read('app/globals.css');
  assert.match(shell,/setCollapsed\(/);
  assert.match(shell,/onClick=\{toggleDesktop\}/);
  assert.match(shell,/athena:sidebar:\$\{tenant.id\}/);
  assert.match(shell,/aria-label=\{collapsed \? "Expandir menú" : "Contraer menú"\}/);
  assert.match(css,/\.lms-shell-collapsed \.lms-sidebar \{width:78px;flex:0 0 78px\}/);
  assert.match(css,/@media \(max-width:960px\)/);
});

test('sesión: heartbeat sin avalanchas ni logout por 503; error raíz no acusa URL', () => {
  const monitor=read('components/auth/session-monitor.tsx');
  const route=read('app/api/auth/session/route.ts');
  const error=read('app/global-error.tsx');
  assert.match(monitor,/if \(stopped \|\| busy/);
  assert.match(monitor,/45_000/);
  assert.match(monitor,/if \(!res.ok\) return/);
  assert.match(route,/catch \{/);
  assert.match(route,/status:503/);
  assert.doesNotMatch(error,/No fue posible conectar con el servicio de academias/);
});
