import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CERT_PAGE_WIDTH,CERT_PAGE_HEIGHT,CERT_IMPORT_BATCH,
  normalizeField,normalizeQr,validateLayout,parsePresets,parseTemplate,parseAutomaticCerts,
  parseRoster,parseEvents,parseImportSummary,certificateApi} from '../lib/course-workspace/certificates.ts';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const f={key:'student_name',x:100,y:300,width:800,height:70,fontSize:40,
  fontFamily:'Georgia',color:'#112233',align:'center',bold:true};
const qr={enabled:true,x:880,y:620,size:116};
const preset={code:'classic',name:'Clásico',width:1122,height:794,fields:[f],qr_config:qr};
const cert={id:1,course_id:5,certificate_code:'ATH-ABC',course_name:'Curso',
  student_name:'María',final_grade:'8.50',status:'EMITIDO',is_valid:true,
  created_at:'2026-11-22T02:00:00Z'};
const roster={course_id:5,certificate_type:'MDT',page:1,page_size:25,total:2,students:[
  {enrollment_id:7,student_name:'María',username:'maria',email:'m@example.test',
    has_identity:true,certificate_id:1,certificate_status:'EMITIDO'},
  {enrollment_id:8,student_name:'José',username:'jose',email:'j@example.test',
    has_identity:false,certificate_id:null,certificate_status:'PENDIENTE'},
]};
const event={id:1,actor_user_id:2,action:'CORRECT',previous_status:'EMITIDO',new_status:'EMITIDO',
  reason:'Legibilidad',created_at:'2026-11-22T03:00:00Z'};

test('lienzo y formatos de renderer coinciden; QR obligatorio y campos limitados',()=>{
  assert.equal(CERT_PAGE_WIDTH,1122);assert.equal(CERT_PAGE_HEIGHT,794);
  assert.equal(normalizeField(f).fontFamily,'Georgia');
  assert.deepEqual(normalizeQr(qr),qr);
  assert.equal(validateLayout([f],qr).fields[0].width,800);
  assert.throws(()=>normalizeQr({...qr,enabled:false}),/inválida/);
  assert.throws(()=>normalizeQr({...qr,x:1120}),/inválida/);
  assert.throws(()=>normalizeField({...f,key:'evil'}),/inválida/);
  assert.throws(()=>normalizeField({...f,large:'ignored',width:1200}),/inválida/);
  assert.throws(()=>normalizeField({...f,x:900}),/inválida/);
  assert.throws(()=>validateLayout(Array.from({length:101},()=>f),qr),/inválida/);
});
test('plantillas y automatizados normalizados; rechaza cursos ajenos',()=>{
  assert.equal(parsePresets([preset])[0].code,'classic');
  assert.equal(parseTemplate({id:9,course_id:5,fields:[f],qr_config:qr,
    has_background:true,updated_at:'2026-11-22T02:00:00Z'},5).has_background,true);
  assert.equal(parseAutomaticCerts([cert],5)[0].status,'EMITIDO');
  assert.throws(()=>parseAutomaticCerts([{...cert,course_id:6}],5),/inválida/);
  assert.throws(()=>parseTemplate({id:1,course_id:6,fields:[f],qr_config:qr,
    has_background:false,updated_at:'2026-11-22T02:00:00Z'},5),/inválida/);
});
test('matrículas aceptadas, faltantes y eventos conservan estados',()=>{
  assert.equal(parseRoster(roster,5,'MDT').students[1].certificate_id,null);
  assert.throws(()=>parseRoster(roster,5,'INSTITUTIONAL'),/inválida/);
  assert.equal(parseEvents([event])[0].action,'CORRECT');
  const batch=parseImportSummary({course_id:5,certificate_type:'MDT',processed:2,results:[
    {filename:'1804124160-signed.pdf',status:'imported',id:3},
    {filename:'documento.pdf',status:'error',message:'Sin cédula'},
  ]},5,'MDT');
  assert.equal(batch.results[1].message,'Sin cédula');assert.equal(CERT_IMPORT_BATCH,20);
});
test('BFF: solo admin, rutas permitidas, firma/archivos privados, límites y defensa CSRF',()=>{
  const file=source('app/api/courses/[id]/certificates/[[...action]]/route.ts');
  assert.match(file,/getCourseWorkspace\(courseId\)/);assert.match(file,/workspace\.role!=='ADMIN'/);
  assert.match(file,/SESSION_COOKIE/);assert.match(file,/mutation\(request,'form'\)/);
  assert.match(file,/mutation\(request,'json'\)/);assert.match(file,/transform\(chunk,controller\)/);
  assert.match(file,/private, no-store/);assert.match(file,/frame-ancestors 'self'/);
  assert.match(file,/certificate-templates/);assert.match(file,/external-certificates/);
  assert.match(file,/external','students/);assert.match(file,/CERT_IMPORT_BATCH\*MAX_CERT_PDF/);
  assert.match(file,/\/history\/\$\{resourceId\(a,3\)\}/);
  assert.doesNotMatch(file,/export async function DELETE|NEXT_PUBLIC_BACKEND|business_id=/);
  assert.doesNotMatch(file,/\/issue['"`]|\/external.*\/revoke|\/external.*\/renew/);
});
test('editor: PDF de prueba sin emisión, 1122x794 y QR requerido',()=>{
  const file=source('components/campus/certificate-template-editor.tsx');
  assert.match(file,/CERT_PAGE_WIDTH/);assert.match(file,/CERT_PAGE_HEIGHT/);
  assert.match(file,/pointerId/);assert.match(file,/width:entry.width/);
  assert.match(file,/new FormData/);assert.match(file,/template\/preview/);
  assert.match(file,/template`,\{method:'PUT'/);
  assert.match(file,/URL\.revokeObjectURL/);
  assert.doesNotMatch(file,/innerHTML|dangerouslySetInnerHTML/);
});
test('UI exclusiva ADMIN con plantilla MOOC y flujos externos MDT/institucional',()=>{
  const entry=source('app/campus/courses/[id]/[section]/page.tsx');
  const ui=source('components/campus/course-certificates.tsx');
  const external=source('components/campus/certificate-external-manager.tsx');
  const automatic=source('components/campus/certificate-automatic-manager.tsx');
  assert.match(entry,/if\(section==='certificates'\)/);assert.match(entry,/ws\.role!=='ADMIN'/);
  assert.match(ui,/courseCode==='MOOC'/);assert.match(ui,/enabled\('INSTITUTIONAL'\)/);
  assert.match(external,/Importar/);assert.match(external,/external\/import\?type=/);
  assert.match(external,/CERT_IMPORT_BATCH/);assert.match(external,/external\/students\/\$\{student\.enrollment_id\}/);
  assert.match(external,/CORRECT/);assert.doesNotMatch(external,/\/revoke|\/renew/);
  assert.match(automatic,/automatic\/\$\{decision\.certificate\.id\}\/\$\{decision\.action\}/);
  assert.doesNotMatch(automatic,/\/generate|\/issue/);
  assert.match(source('components/campus/course-certificates.module.css'),/var\(--tenant-accent-ink\)/);
  assert.match(source('components/campus/course-certificates.module.css'),/@media\(max-width:720px\)/);
  assert.ok(certificateApi(5,'template/preview').includes('/api/courses/5/certificates/template/preview'));
});
