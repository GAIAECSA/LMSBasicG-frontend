import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readMdtSummary,readMdtStudents,mdtAttachmentPreviewUrl,mdtPdfPreviewUrl,
  validateMdtFiles,MAX_MDT_PDF} from '../lib/course-workspace/mdt-resources.ts';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(path)=>readFileSync(resolve(root,path),'utf8');

const block={id:4,title:'Evidencia',kind:'pdf',order:1,is_active:false,updated_at:null,
  instructions:null,uploaded_students:null,total_students:null,filename:'informe.pdf',has_file:true,
  preview_url:'https://untrusted.example/private?token=SECRET'};
const attachment={id:7,original_filename:'cedula.pdf',content_type:'application/pdf',size:3200,
  download_url:'https://untrusted.example/documento',preview_url:'https://untrusted.example/pdf?secret=1'};
const submission={id:6,enrollment_id:5,lesson_block_id:3,comment:null,
  created_at:'2026-11-21T21:00:00Z',updated_at:'2026-11-21T21:00:00Z',attachments:[attachment]};
const row={enrollment_id:5,user_id:12,firstname:'Ana',lastname:'Lopez',username:'ana',email:null,
  submitted:true,legacy_requires_migration:false,requires_pdf_update:false,response:submission};

test('solo se usan URLs BFF derivadas de IDs, no preview_url de FastAPI',()=>{
  const value=readMdtSummary({course_id:1,student_documents:[],institutional_pdfs:[block]},1);
  const doc=readMdtStudents({course_id:1,lesson_block_id:3,page:1,page_size:25,total:1,items:[row]},1,3);
  assert.equal(value.institutional_pdfs[0].can_preview,true);
  assert.equal(doc.items[0].response.attachments[0].can_preview,true);
  assert.equal('preview_url' in doc.items[0].response.attachments[0],false);
  assert.equal('preview_url' in value.institutional_pdfs[0],false);
  assert.equal(mdtPdfPreviewUrl(1,4),'/api/mdt-resources/courses/1/pdf/4/preview');
  assert.equal(mdtAttachmentPreviewUrl(1,7),'/api/mdt-resources/courses/1/attachments/7/preview');
  assert.doesNotMatch(mdtPdfPreviewUrl(1,4),/SECRET|untrusted/);
});

test('no acepta varios PDF ni imágenes para ninguno de los dos recursos MDT',()=>{
  for(const kind of ['pdf','homework']){
    assert.equal(validateMdtFiles([{name:'normal.PDF',size:MAX_MDT_PDF}],kind),null);
    assert.match(validateMdtFiles([{name:'normal.pdf',size:1},{name:'otro.pdf',size:1}],kind),/exactamente un/);
    assert.match(validateMdtFiles([{name:'foto.png',size:1}],kind),/PDF/);
    assert.match(validateMdtFiles([{name:'grande.pdf',size:MAX_MDT_PDF+1}],kind),/25 MiB/);
  }
});

test('BFF distingue preview inline y descarga attachment para ambos tipos',()=>{
  const bff=read('app/api/mdt-resources/courses/[id]/[[...resource]]/route.ts');
  assert.match(bff,/s\[2\]==='preview'/);
  assert.match(bff,/\/api\/v1\/homework-response\/attachments\/\$\{attachment\}\/\$\{s\[2\]\}/);
  assert.match(bff,/preview=true/);
  assert.match(bff,/download=true/);
  assert.match(bff,/mode==='preview'\?'inline/);
  assert.match(bff,/mode==='download'/);
  assert.match(bff,/X-Frame-Options.*SAMEORIGIN/s);
  assert.match(bff,/Content-Security-Policy/);
  assert.match(bff,/Cache-Control/);
  assert.match(bff,/redirect:'error'/);
  assert.match(bff,/const max=multipartMax/);
  assert.doesNotMatch(bff,/10\*50\*1024/);
});

test('visor privado tiene cierre, foco, fallback y descarga separada',()=>{
  const viewer=read('components/campus/mdt-pdf-preview.tsx');
  const doc=read('components/campus/mdt-student-documents.tsx');
  const institutional=read('components/campus/mdt-institutional-pdfs.tsx');
  const css=read('app/globals.css');
  assert.match(viewer,/aria-modal="true"/);
  assert.match(viewer,/iframe/);
  assert.match(viewer,/referrerPolicy="no-referrer"/);
  assert.match(viewer,/Escape/);
  assert.match(viewer,/previouslyFocused\?\.focus\(\)/);
  assert.match(viewer,/Abrir en otra pestaña/);
  assert.match(viewer,/Descargar PDF/);
  assert.match(doc,/mdtAttachmentPreviewUrl/);
  assert.match(doc,/requires_pdf_update/);
  assert.match(doc,/form\.append\('files',files\[0\]/);
  assert.match(institutional,/mdtPdfPreviewUrl/);
  assert.match(institutional,/form\.set\('file',file/);
  assert.match(css,/\.mdt-preview-dialog/);
  assert.match(css,/--tenant-primary/);
  assert.doesNotMatch(viewer,/localStorage|Bearer|\/private-files/);
});

test('una entrega con nombre PDF ofrece Ver PDF aunque el MIME histórico no tuviera preview_url',()=>{
  const doc=read('components/campus/mdt-student-documents.tsx');
  assert.match(doc,/file\.can_preview\|\|\/\\\.pdf\$\/i\.test\(file\.original_filename\)/);
  assert.match(doc,/Ver PDF/);
  assert.match(doc,/Descargar anterior/); // Solo documentos que no son PDF.
  assert.match(doc,/setPreview\(\{id:file\.id/);
});


test('Ver PDF es botón visual y Descargar queda dentro del visor',()=>{
  const doc=read('components/campus/mdt-student-documents.tsx');
  const viewer=read('components/campus/mdt-pdf-preview.tsx');
  const css=read('app/globals.css');
  assert.match(doc,/className="lms-outline-button mdt-document-view"/);
  assert.match(viewer,/Descargar PDF/);
  assert.match(css,/\.mdt-document-view:hover/);
});


test('tabla de documentos MDT presenta solo Ver PDF, sin nombre ni tamaño debajo',()=>{
  const doc=read('components/campus/mdt-student-documents.tsx');
  assert.match(doc,/Ver PDF/);
  assert.match(doc,/Sin adjuntos/);
  assert.match(doc,/mdtAttachmentPreviewUrl/);
  const attachmentCell=doc.split('<td>{row.response?.attachments.length?')[1].split('</td>')[0];
  assert.doesNotMatch(attachmentCell,/mdt-document-name/);
  assert.doesNotMatch(attachmentCell,/humanSize\(file\.size\)/);
  assert.match(doc,/Descargar anterior/); // Documento legacy no PDF.
  assert.match(doc,/Reemplazar/);
});
