import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {workspaceItems,mayOpenSection} from '../lib/course-workspace/navigation.ts';
import {readMdtSummary,readMdtStudents,readMdtHomeworkResponse,readMdtPdfUpload,
  readMdtEvents,mdtAttachmentUrl,mdtPdfUrl,mdtAttachmentPreviewUrl,mdtPdfPreviewUrl,validateMdtFiles,MAX_MDT_PDF}
  from '../lib/course-workspace/mdt-resources.ts';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>readFileSync(resolve(root,relative),'utf8');
const hw={id:18,title:'Copia Cédula',instructions:'PDF o imagen',order:0,is_active:true,kind:'homework',
  updated_at:null,total_students:12,uploaded_students:8,has_file:null,filename:null,download_url:null};
const pdf={id:20,title:'Informe del instructor',instructions:null,order:4,is_active:false,kind:'pdf',
  updated_at:'2026-11-21T22:00:00Z',has_file:true,filename:'Informe.pdf',download_url:'/api/v1/media/lesson-blocks/20/file',
  preview_url:'/api/v1/media/lesson-blocks/20/file?preview=true',
  total_students:null,uploaded_students:null};
const resp={id:32,enrollment_id:45,lesson_block_id:18,comment:null,teacher_feedback:null,score:null,
  status:'ENTREGADO',created_at:'2026-11-21T22:00:00Z',updated_at:'2026-11-21T22:00:00Z',attachments:[
    {id:56,original_filename:'cedula.pdf',content_type:'application/pdf',size:2024,
      download_url:'/api/v1/homework-response/attachments/56/download',
      preview_url:'/api/v1/homework-response/attachments/56/preview'}]};
const item={enrollment_id:45,user_id:80,firstname:'Ana',lastname:'Pérez',username:'ana',email:'ana@example.com',
  submitted:true,legacy_requires_migration:false,requires_pdf_update:false,response:resp};

test('MDT muestra un solo módulo Recursos MDT para ADMIN y TEACHER; MOOC no',()=>{
  for(const role of ['ADMIN','TEACHER']){
    const mdt=workspaceItems('MDT',role);
    assert.equal(mdt.filter(item=>item.section==='mdt-resources').length,1);
    assert.ok(mayOpenSection('MDT',role,'mdt-resources'));
    assert.equal(mayOpenSection('MDT',role,'mdt-files'),false);
    assert.equal(mayOpenSection('MDT',role,'mdt-evidence'),false);
    assert.equal(mayOpenSection('MOOC',role,'mdt-resources'),false);
  }
});
test('resumen conserva contadores y PDF inactivo para gestión administrativa',()=>{
  const value=readMdtSummary({course_id:5,student_documents:[hw],institutional_pdfs:[pdf]},5);
  assert.equal(value.student_documents[0].uploaded_students,8);
  assert.equal(value.institutional_pdfs[0].is_active,false);
  assert.equal(value.institutional_pdfs[0].has_file,true);
  assert.equal(value.institutional_pdfs[0].can_preview,true);
  assert.equal('download_url' in value.institutional_pdfs[0],false);
  assert.throws(()=>readMdtSummary({course_id:7,student_documents:[hw],institutional_pdfs:[pdf]},5),/inválida/);
  assert.throws(()=>readMdtSummary({course_id:5,student_documents:[{...hw,uploaded_students:13}],institutional_pdfs:[]},5),/contadores/);
  assert.throws(()=>readMdtSummary({course_id:5,student_documents:[hw],institutional_pdfs:[{...pdf,id:18}]},5),/repetidos/);
});
test('estudiante con entrega: adjuntos por id, sin URL directa del backend',()=>{
  const value=readMdtStudents({course_id:5,lesson_block_id:18,page:1,page_size:25,total:2,items:[item,
    {...item,enrollment_id:46,user_id:81,username:'jose',submitted:false,response:null,legacy_requires_migration:true}]},5,18);
  assert.equal(value.items.length,2);
  assert.equal(value.items[1].submitted,false);
  assert.equal(value.items[1].legacy_requires_migration,true);
  assert.equal('download_url' in value.items[0].response.attachments[0],false);
  assert.equal('preview_url' in value.items[0].response.attachments[0],false);
  assert.equal(value.items[0].response.attachments[0].can_preview,true);
  assert.equal(value.items[0].requires_pdf_update,false);
  assert.equal(mdtAttachmentUrl(5,56),'/api/mdt-resources/courses/5/attachments/56/download');
  assert.equal(mdtPdfUrl(5,20),'/api/mdt-resources/courses/5/pdf/20/download');
  assert.equal(mdtAttachmentPreviewUrl(5,56),'/api/mdt-resources/courses/5/attachments/56/preview');
  assert.equal(mdtPdfPreviewUrl(5,20),'/api/mdt-resources/courses/5/pdf/20/preview');
});
test('rechaza entrega ajena, estado inventado, sin adjunto o matrícula repetida',()=>{
  const rows={course_id:5,lesson_block_id:18,page:1,page_size:25,total:1,items:[item]};
  assert.throws(()=>readMdtStudents({...rows,items:[{...item,response:{...resp,enrollment_id:98}}]},5,18),/propiedad/);
  assert.throws(()=>readMdtStudents({...rows,items:[{...item,submitted:false}]},5,18),/estado/);
  assert.throws(()=>readMdtStudents({...rows,items:[item,item]},5,18),/repetidas/);
  assert.throws(()=>readMdtHomeworkResponse({...resp,attachments:null}),/entrega/);
});
test('verifica confirmación del PDF sin seguir su URL backend',()=>{
  const result=readMdtPdfUpload({lesson_block_id:20,filename:'Informe.pdf',download_url:'/api/v1/media/lesson-blocks/20/file',
    is_active:false,updated_at:null},20);
  assert.deepEqual(result,{lesson_block_id:20,filename:'Informe.pdf',is_active:false,updated_at:null});
  assert.throws(()=>readMdtPdfUpload({lesson_block_id:21,filename:'wrong.pdf',is_active:false,updated_at:null},20),/inválida/);
});
test('historial solo expone autor, recurso y matrícula, no hashes ni rutas privadas',()=>{
  const page=readMdtEvents({page:1,page_size:15,total:1,items:[{
    id:1,course_id:5,lesson_block_id:18,actor_user_id:10,enrollment_id:45,
    homework_response_id:32,action:'DOCUMENT_REPLACED',created_at:'2026-11-21T22:00:00Z',
    details:{sha256:['secreto'],storage_path:'/private-files/'}}]});
  assert.equal(page.items[0].actor_user_id,10);
  assert.equal('details' in page.items[0],false);
});
test('PDF único de 25 MiB se aplica a ambos tipos MDT, no a Homework académico',()=>{
  for(const kind of ['pdf','homework']){
    assert.equal(validateMdtFiles([{name:'cedula.PDF',size:MAX_MDT_PDF}],kind),null);
    assert.match(validateMdtFiles([] ,kind),/exactamente un/i);
    assert.match(validateMdtFiles([{name:'a.pdf',size:100},{name:'b.pdf',size:100}],kind),/exactamente un/i);
    assert.match(validateMdtFiles([{name:'foto.png',size:1024}],kind),/PDF/);
    assert.match(validateMdtFiles([{name:'documento.exe',size:1024}],kind),/PDF/);
    assert.match(validateMdtFiles([{name:'a.pdf',size:MAX_MDT_PDF+1}],kind),/25 MiB/);
    assert.match(validateMdtFiles([{name:'a.pdf',size:0}],kind),/25 MiB/);
  }
});
test('documentos antiguos conservan datos y exigen actualización sin visor',()=>{
  const legacy={...resp,attachments:[
    {id:60,original_filename:'cedula.png',content_type:'image/png',size:1400,
      preview_url:null,download_url:'/api/v1/homework-response/attachments/60/download'},
    {id:61,original_filename:'cedula2.pdf',content_type:'application/pdf',size:1500,
      preview_url:'/api/v1/homework-response/attachments/61/preview'}]};
  const student={...item,requires_pdf_update:true,response:legacy};
  const parsed=readMdtStudents({course_id:5,lesson_block_id:18,page:1,page_size:25,total:1,items:[student]},5,18);
  assert.equal(parsed.items[0].requires_pdf_update,true);
  assert.equal(parsed.items[0].response.attachments.length,2);
  assert.equal(parsed.items[0].response.attachments[0].can_preview,false);
  assert.equal(parsed.items[0].response.attachments[1].can_preview,true);
  const oldPdf=readMdtSummary({course_id:5,student_documents:[],institutional_pdfs:[{...pdf,preview_url:null}]},5);
  assert.equal(oldPdf.institutional_pdfs[0].can_preview,false);
});
test('BFF autoriza servidor, filtra query y usa proxy privado streaming con tamaño acotado',()=>{
  const bff=read('app/api/mdt-resources/courses/[id]/[[...resource]]/route.ts');
  assert.match(bff,/getCourseWorkspace\(courseId\)/);
  assert.match(bff,/result\.workspace\.role==='STUDENT'/);
  assert.match(bff,/result\.workspace\.code!=='MDT'/);
  assert.match(bff,/mutation\(request,'form'\)/);
  assert.match(bff,/apiFetch\(/);
  assert.match(bff,/TransformStream/);
  assert.match(bff,/size>max/);
  assert.match(bff,/multipartMax=MAX_MDT_PDF/);
  assert.match(bff,/preview=true/);
  assert.match(bff,/download=true/);
  assert.match(bff,/attachments/);
  assert.match(bff,/Content-Disposition/);
  assert.match(bff,/inline; filename/);
  assert.match(bff,/attachment; filename/);
  assert.match(bff,/SAMEORIGIN/);
  assert.match(bff,/redirect:'error'/);
  assert.match(bff,/no-store/);
  assert.match(bff,/readMdtSummary/);
  assert.match(bff,/readMdtStudents/);
  assert.doesNotMatch(bff,/NEXT_PUBLIC_BACKEND|business_id=|window\./);
});
test('interfaz mantiene dos apartados y subida por matrícula, sin notas',()=>{
  const main=read('components/campus/course-mdt-resources.tsx');
  const doc=read('components/campus/mdt-student-documents.tsx');
  const pdf=read('components/campus/mdt-institutional-pdfs.tsx');
  const page=read('app/campus/courses/[id]/[section]/page.tsx');
  assert.match(main,/Archivos de estudiantes/);
  assert.match(main,/Evidencias institucionales/);
  assert.match(doc,/students\/\$\{editor\.enrollment_id\}\/files/);
  assert.match(doc,/multipart|FormData/);
  assert.match(doc,/legacy_requires_migration/);
  assert.match(pdf,/mdtPdfUrl/);
  assert.match(pdf,/mdtPdfPreviewUrl/);
  assert.match(doc,/mdtAttachmentPreviewUrl/);
  assert.match(doc,/requires_pdf_update/);
  assert.match(doc,/accept=\"\.pdf,application\/pdf\"/);
  assert.doesNotMatch(doc,/<input[^>]+multiple/);
  const preview=read('components/campus/mdt-pdf-preview.tsx');
  assert.match(preview,/<iframe/);
  assert.match(preview,/aria-modal=\"true\"/);
  assert.match(preview,/Descargar PDF/);
  assert.match(preview,/Escape/);
  assert.match(page,/CourseMdtResources/);
  assert.doesNotMatch(doc,/grade|calificar|\/uploads\//);
});
