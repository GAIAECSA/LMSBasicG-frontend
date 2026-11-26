import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseDuplicateInput } from '../lib/academic/course-duplicate.ts';
import { parseProfile,parseProfilePatch,profileDraft,draftPatch,safeLogo,normalizedHex,validLogoFile,LOGO_MAX_BYTES } from '../lib/tenant/profile.ts';
import { buildTenant,contrast,tenantCssVars } from '../lib/tenant/branding.ts';
import { createAsyncTtlCache } from '../lib/tenant/ttl-cache.ts';
const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const logo='/api/v1/tenant/logo?domain=uno.com&v=abc123';
const fixture={id:1,name:'Academia Uno',tenant_domain:'uno.com',landing_domain:'landing.uno.com',logo_url:logo,email:'admin@example.com',phone:'+593 99 000 0000',branding_config:{version:1,colors:{primary:'#abc',primary_soft:'#F0F0F0',ext:'x'},content:{hero:{title:'Hola',extra:'x'},ext:'x'},ext:{kept:true}}};

test('duplicación: nombre nuevo, fechas opcionales y año bisiesto válido',()=>{
 assert.deepEqual(parseDuplicateInput({name:'  Nueva edición  '}),{name:'Nueva edición',init_date:null,finish_date:null});
 assert.deepEqual(parseDuplicateInput({name:'X',init_date:'2028-02-29',finish_date:'2028-02-29'}),{name:'X',init_date:'2028-02-29',finish_date:'2028-02-29'});
 assert.ok(parseDuplicateInput({name:'X',finish_date:'2027-01-01'}));
});
test('duplicación: rechaza IDs, publicación y propiedades extra, fechas imposibles o invertidas',()=>{
 for(const bad of [null,[],{}, {name:' '},{name:'x'.repeat(256)},{name:'X',business_id:2},{name:'X',is_published:true},{name:'X',course_type_id:4},{name:'X',init_date:'2027-02-29'},{name:'X',init_date:'2027-04-31'},{name:'X',init_date:'0000-01-01'},{name:'X',init_date:'2027-01-01T00:00:00Z'},{name:'X',init_date:'2027-02-02',finish_date:'2027-02-01'}])assert.equal(parseDuplicateInput(bad),null);
});
test('perfil: se acepta únicamente la identidad autenticada; se filtran extensiones arbitrarias de respuesta',()=>{
 assert.equal(parseProfile(fixture,2),null);
 assert.equal(parseProfile({...fixture,id:'1'},1),null);
 assert.equal(parseProfile({...fixture,logo_url:'/api/v1/tenant/logo?domain=otro.com'},1),null);
 const profile=parseProfile(fixture,1);assert.ok(profile);
 assert.equal(profile.logo_url,logo);assert.equal(profile.landing_domain,'landing.uno.com');
 assert.deepEqual(profile.branding_config,{colors:{primary:'#abc',primary_soft:'#F0F0F0'},content:{hero:{title:'Hola'}}});
});
test('perfil: normalización y PATCH parcial, sin campos administrativos reservados',()=>{
 assert.deepEqual(parseProfilePatch({name:' Academia ',email:'',phone:' +593 ',branding_config:{colors:{primary:'#abcdef'}}}),{name:'Academia',email:null,phone:'+593',branding_config:{colors:{primary:'#ABCDEF'}}});
 for(const patch of [{business_id:2},{id:2},{tenant_domain:'otro.com'},{landing_domain:null},{logo_url:'x'},{is_active:false},{licenses:['MOOC']},{name:''},{name:null},{name:'<script>'},{email:'incorrecto'},{phone:'x'.repeat(51)},{branding_config:null},{branding_config:{colors:{sidebar:'#111111'}}},{branding_config:{colors:{primary:'#abc'}}},{branding_config:{colors:{primary:'red; background:url(x)'}}},{branding_config:{content:{hero:{title:'<b>Hola</b>'}}}},{branding_config:{content:{hero:{description:'x'.repeat(301)}}}}])assert.equal(parseProfilePatch(patch),null);
});
test('perfil: reset de colores y textos no modifica otros grupos',()=>{
 assert.deepEqual(parseProfilePatch({branding_config:{colors:null}}),{branding_config:{colors:null}});
 assert.deepEqual(parseProfilePatch({branding_config:{content:{hero:null}}}),{branding_config:{content:{hero:null}}});
 assert.deepEqual(parseProfilePatch({branding_config:{colors:{primary:null},content:{hero:{title:''}}}}),{branding_config:{colors:{primary:null},content:{hero:{title:null}}}});
});
test('editor: cambios mínimos, borrar contacto, y conservar colores legacy al guardar otros campos',()=>{
 const base=profileDraft(parseProfile(fixture,1));
 assert.equal(base.colors.primary,'#AABBCC');
 assert.deepEqual(draftPatch(base,structuredClone(base)),{});
 const draft=structuredClone(base);draft.phone='';draft.hero.title='Nuevo título';
 assert.deepEqual(draftPatch(base,draft),{phone:null,branding_config:{content:{hero:{title:'Nuevo título'}}}});
 draft.colors.primary='#00AA00';
 assert.deepEqual(draftPatch(base,draft),{phone:null,branding_config:{colors:{primary:'#00AA00'},content:{hero:{title:'Nuevo título'}}}});
 draft.colors.primary='invalid';assert.equal(draftPatch(base,draft),null);
});
test('editor: restablecer un grupo y volver a elegir un color conserva el nuevo valor',()=>{
 const base=profileDraft(parseProfile(fixture,1));const draft=structuredClone(base);
 for(const key in draft.colors)draft.colors[key]='';
 assert.deepEqual(draftPatch(base,draft,true),{branding_config:{colors:null}});
 draft.colors.primary='#112233';const patch=draftPatch(base,draft,true);
 assert.equal(patch.branding_config.colors.primary,'#112233');assert.equal(patch.branding_config.colors.primary_soft,null);
 for(const key in draft.hero)draft.hero[key]='';
 assert.deepEqual(draftPatch(base,{...base,hero:draft.hero},false,true),{branding_config:{content:{hero:null}}});
});
test('logo: origen relativo, dominio exacto, versionado y no parámetros duplicados',()=>{
 assert.equal(safeLogo(logo,'uno.com'),logo);
 for(const bad of ['https://uno.com/api/v1/tenant/logo?domain=uno.com','/uploads/private/a.png','/api/v1/tenant/logo?domain=otro.com','/api/v1/tenant/logo?domain=uno.com&domain=otro.com','/api/v1/tenant/logo?domain=uno.com&v=1&v=2','/api/v1/tenant/logo?domain=uno.com&path=/private','/api/v1/tenant/logo?domain=uno.com#x'])assert.equal(safeLogo(bad,'uno.com'),null);
});
test('logo: tipo, extensión, tamaño exacto 10 MiB y no archivos vacíos',()=>{
 assert.ok(validLogoFile(new File([new Uint8Array(LOGO_MAX_BYTES)],'logo.PNG',{type:'image/png'})));
 assert.ok(validLogoFile(new File(['x'],'logo.webp',{type:'image/webp'})));
 for(const file of [new File([],'a.png',{type:'image/png'}),new File(['x'],'a.svg',{type:'image/svg+xml'}),new File(['x'],'a.exe',{type:'image/png'}),new File([new Uint8Array(LOGO_MAX_BYTES+1)],'a.jpg',{type:'image/jpeg'})])assert.equal(validLogoFile(file),false);
});
test('branding: preview reutiliza tokens existentes y detecta bajo contraste',()=>{
 assert.equal(normalizedHex('#aBc'),'#AABBCC');assert.equal(normalizedHex('css()'),'');
 const preview=buildTenant({...fixture,matched_domain:'uno.com',matched_domain_type:'TENANT',branding_config:{colors:{primary:'#FDFDFD',text:'#EEEEEE',surface:'#FFFFFF'},content:{hero:{title:'Nuevo título'}}}});
 assert.equal(preview.hero.title,'Nuevo título');assert.equal(tenantCssVars(preview.theme)['--tenant-primary'],'#FDFDFD');
 assert.ok(contrast(preview.theme.primary,preview.theme.onPrimary)>=4.5);assert.ok(contrast(preview.theme.text,preview.theme.surface)<4.5);
 assert.equal(preview.logoUrl,logo);
});
test('caché: invalidar campus y landing no afecta un tercer tenant',async()=>{
 const cache=createAsyncTtlCache(20000);for(const host of ['uno.com','landing.uno.com','otro.com'])await cache.get(host,async()=>1);
 cache.invalidate('uno.com');cache.invalidate('landing.uno.com');
 assert.equal(await cache.get('uno.com',async()=>2),2);assert.equal(await cache.get('landing.uno.com',async()=>3),3);assert.equal(await cache.get('otro.com',async()=>4),1);
});
test('caché: respuesta anterior al guardado no vuelve a poblar caché ni borra una petición nueva',async()=>{
 const cache=createAsyncTtlCache(20000);let finishOld,finishNew;
 const old=cache.get('uno.com',()=>new Promise(resolve=>{finishOld=resolve;}));await Promise.resolve();
 cache.invalidate('uno.com');
 const fresh=cache.get('uno.com',()=>new Promise(resolve=>{finishNew=resolve;}));await Promise.resolve();
 finishOld('viejo');assert.equal(await old,'viejo');
 const joined=cache.get('uno.com',async()=> 'incorrecto');assert.equal(joined,fresh);
 finishNew('nuevo');assert.equal(await fresh,'nuevo');assert.equal(await cache.get('uno.com',async()=> 'incorrecto'),'nuevo');
});
test('caché: petición invalidada que falla no elimina una nueva respuesta',async()=>{
 const cache=createAsyncTtlCache(20000);let fail;const old=cache.get('uno.com',()=>new Promise((_,reject)=>{fail=reject;}));await Promise.resolve();
 cache.invalidate('uno.com');await cache.get('uno.com',async()=>2);fail(Error('down'));await assert.rejects(old);assert.equal(await cache.get('uno.com',async()=>3),2);
});
test('BFF: rutas nuevas usan autorización, validación, protección CSRF y no exponen JWT',()=>{
 const duplicate=read('app/api/academic/courses/[id]/duplicate/route.ts');
 const profile=read('app/api/tenant/admin/profile/route.ts');const upload=read('app/api/tenant/admin/logo/route.ts');
 for(const route of [duplicate,profile,upload]){assert.match(route,/authorize\(request\)/);assert.match(route,/mutation\(request/);assert.doesNotMatch(route,/localStorage|access_token/);}
 assert.match(duplicate,/\/api\/v1\/courses\/\$\{id\}\/duplicate/);assert.match(duplicate,/AbortSignal\.timeout\(240_000\)/);assert.match(duplicate,/201\)/);
 for(const route of [profile,upload])assert.match(route,/invalidateTenantDomains\(before\.tenant_domain,before\.landing_domain,tenant\.matchedDomain\)/);
 assert.match(upload,/multipart\(request,LOGO_MAX_BYTES\+64\*1024\)/);assert.match(upload,/body\.set\('file',file\)/);
});
test('UI: acción copiar con licencia, estado ocupado, consulta tras fallo y ruta administrativa restringida',()=>{
 assert.match(read('components/campus/admin-courses.tsx'),/allowed\.includes\(course\.course_type\.code\)/);
 const dialog=read('components/campus/course-duplicate-dialog.tsx');assert.match(dialog,/if\(lock\.current\|\|uncertain\)return/);assert.match(dialog,/Comprobar listado/);assert.match(dialog,/router\.push\(`\/campus\/courses\/\$\{copied\.id\}`\)/);
 const shell=read('components/campus/campus-shell.tsx');assert.match(shell,/admin&&<Link href="\/campus\/settings"/);assert.match(read('app/campus/settings/page.tsx'),/isTenantAdmin\(state\.user\.role\)/);
 const settings=read('components/campus/admin-institution-settings.tsx');assert.match(settings,/router\.refresh\(\)/);assert.match(settings,/tenantCssVars\(theme\)/);assert.match(settings,/type="color"/);assert.match(settings,/confirmAction\(/);
 assert.match(read('nginx/default.conf.template'),/proxy_read_timeout 300s;/);
});
