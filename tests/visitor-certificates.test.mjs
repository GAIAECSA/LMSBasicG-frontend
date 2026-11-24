import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(join(root,p),'utf8');

test('certificados VISITOR no depende del catálogo público ni de is_published',()=>{
 const data=read('lib/visitor/certificates.ts');
 assert.match(data,/\/api\/v1\/visitor-certificates\/my/);
 assert.doesNotMatch(data,/getTenantPublicCourses|visibleAcceptedEnrollments/);
 const page=read('app/campus/certificates/page.tsx');
 assert.match(page,/authState\(tenant\)/);
 assert.match(page,/state\.user\.role\.code!==\"VISITOR\"/);
 assert.match(page,/loadVisitorCerts/);
});

test('BFF autoriza cada PDF con lista propia, IDs y allowlist',()=>{
 const route=read('app/api/visitor/certificates/[courseId]/[kind]/[certificateId]/[action]/route.ts');
 assert.match(route,/visitor-certificates\/courses\/\$\{courseId\}/);
 assert.match(route,/cert\.can_download/);
 assert.match(route,/cert\.can_preview/);
 assert.match(route,/cert\.can_generate/);
 assert.match(route,/sameOriginRequest\(request\)/);
 assert.match(route,/\/api\/v1\/external-certificates\/\$\{certificateId\}/);
 assert.match(route,/\/api\/v1\/certificates\/\$\{certificateId\}/);
 assert.doesNotMatch(route,/localStorage|window\.location|file_url/);
});

test('descarga MDT usa download para conservar visited_at y existe preview independiente',()=>{
 const comp=read('components/campus/visitor-certificates.tsx');
 assert.match(comp,/href=\{endpoint\(course\.course_id,cert,'download'\)\}/);
 assert.match(comp,/previewUrl=\{endpoint\(view\.course\.course_id,view\.cert,'preview'\)\}/);
 assert.match(comp,/Certificado ministerial MDT/);
 assert.match(comp,/Certificado institucional/);
 assert.match(comp,/Certificado MOOC/);
 assert.match(comp,/router\.refresh\(\)/);
});

test('branding consume tokens institucionales, sin código del logo de un tenant',()=>{
 const css=read('components/campus/visitor-certificates.module.css');
 for(const token of ['--tenant-primary','--tenant-on-primary','--tenant-primary-soft','--tenant-accent-ink','--tenant-surface'])assert.match(css,new RegExp(token));
 assert.doesNotMatch(css,/Gaia Academic|tenant_domain|Academia Desarrollo/);
});

import {parseVisitorCertList} from '../lib/visitor/certificate-types.ts';
const valid={courses:[{course_id:12,course_name:'MDT oculto',course_type:'MDT',is_published:false,academic_eligible:true,
 certificate_note:null,certificates:[{id:7,type:'MDT',status:'EMITIDO',can_preview:true,can_download:true,can_generate:false,registered_at:null},
 {id:8,type:'INSTITUTIONAL',status:'EMITIDO',can_preview:true,can_download:true,can_generate:false,registered_at:null}]}],page:1,page_size:24,total:1};
test('contrato privado permite dos documentos MDT del mismo curso oculto',()=>{
 assert.equal(parseVisitorCertList(valid)?.courses[0].certificates.length,2);
 assert.equal(parseVisitorCertList({...valid,courses:[{...valid.courses[0],course_type:'MOOC'}]}),null);
 assert.equal(parseVisitorCertList({...valid,courses:[{...valid.courses[0],certificates:[{...valid.courses[0].certificates[0],id:0}]}]}),null);
 assert.equal(parseVisitorCertList({...valid,courses:[valid.courses[0],valid.courses[0]]}),null);
});
