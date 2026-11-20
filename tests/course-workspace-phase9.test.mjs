import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname,resolve } from 'node:path';
import { workspaceItems,mayOpenSection } from '../lib/course-workspace/navigation.ts';
import { courseEditorFrom,courseUpdateForm,validateEditor } from '../lib/course-workspace/editor.ts';

const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(name)=>readFileSync(resolve(base,name),'utf8');
const sample={id:6,name:'Curso de prueba',description:'Descripción',price:40,discount_price:20,
  is_free:false,level:'PRINCIPIANTE',is_published:false,open_enrollment:false,
  duration_hours:12,total_lessons:3,image_url:null,currency:'USD',
  init_date:'2026-11-20',finish_date:'2026-12-20',total_students:0,
  grade_calculation_method:'AVERAGE',subcategory_id:4,course_type_id:3,
  course_type:{id:3,code:'MOOC',name:'MOOC'},published_at:null,certificate_types:[]};

test('menú MOOC de ADMIN es exacto y no incluye opciones MDT',()=>{
  assert.deepEqual(workspaceItems('MOOC','ADMIN').map(x=>x.label),[
    'Módulos','Asistencia','Calificaciones','Matrículas','Certificados','Configuraciones']);
  assert.equal(mayOpenSection('MOOC','ADMIN','reports'),false);
  assert.equal(mayOpenSection('MOOC','ADMIN','mdt-files'),false);
});
test('menú MDT de ADMIN incluye asistencias unificadas y reportes',()=>{
  assert.deepEqual(workspaceItems('MDT','ADMIN').map(x=>x.label),[
    'Módulos','Asistencia','Archivos MDT','Evidencia MDT','Calificaciones',
    'Matrículas','Certificados','Reportes','Configuraciones']);
  assert.equal(workspaceItems('MDT','ADMIN').filter(x=>x.label==='Asistencia').length,1);
});
test('TEACHER no ve ni puede abrir matrículas, certificados, reportes o configuraciones',()=>{
  for(const type of ['MOOC','MDT']){
    const sections=workspaceItems(type,'TEACHER').map(x=>x.section);
    assert.ok(sections.includes('modules')&&sections.includes('attendance')&&sections.includes('grades'));
    for(const section of ['reports','settings','enrollments','certificates']){
      assert.equal(sections.includes(section),false);
      assert.equal(mayOpenSection(type,'TEACHER',section),false);
    }
  }
});
test('ADMIN no requiere matrícula y TEACHER sí requiere ACEPTADO (gate SSR)',()=>{
  const server=read('lib/course-workspace/server.ts');
  assert.match(server,/if\(isTenantAdmin\(state.user.role\)\)/);
  assert.match(server,/api\/v1\/enrollments\/me/);
  assert.match(server,/item.status==='ACEPTADO'/);
  assert.match(server,/parseVisitorEnrollments/);
  assert.match(server,/course\.is_published/);
  assert.match(server,/\/workspace`/);
  assert.doesNotMatch(server,/guess|is_mdt|role_id===/);
  const layout=read('app/campus/courses/[id]/layout.tsx');
  assert.match(layout,/courseWorkspace=\{workspace.role==='STUDENT'\?undefined/);
  assert.match(layout,/notFound\(\)/);
});
test('en página de curso primero módulos y configuraciones solo ADMIN',()=>{
  assert.match(read('app/campus/courses/[id]/page.tsx'),/\/modules/);
  const section=read('app/campus/courses/[id]/[section]/page.tsx');
  assert.match(section,/mayOpenSection/);
  assert.match(section,/ws.role!=='ADMIN'/);
  assert.match(section,/if\(section==='modules'\)/);
  assert.doesNotMatch(section,/Certificados habilitados|Próximos apartados del curso/);
  assert.match(read('components/campus/campus-shell.tsx'),/courseWorkspace \? <>/);
});
test('formulario envía PATCH sin tipo ni calificación, incluye publicación e imagen',()=>{
  const values=courseEditorFrom(sample);
  values.name='Curso editado';values.isPublished=true;values.openEnrollment=true;
  const form=courseUpdateForm(values);
  assert.equal(form.get('name'),'Curso editado');
  assert.equal(form.get('is_published'),'true');
  assert.equal(form.get('open_enrollment'),'true');
  assert.equal(form.get('discount_price'),'20');
  assert.equal(form.get('init_date'),'2026-11-20');
  assert.equal(form.has('course_type_id'),false);
  assert.equal(form.has('grade_calculation_method'),false);
  const component=read('components/campus/admin-course-detail.tsx');
  assert.match(component,/method:'PATCH',body:courseUpdateForm\(form\)/);
  assert.match(component,/\/grade-method/);
  assert.doesNotMatch(component,/type-change|type-preview|Certificados habilitados|Próximos apartados del curso/);
});
test('limpieza de descuento y fechas falla cerrado; curso gratuito permite descuento null',()=>{
  const v=courseEditorFrom(sample);
  assert.equal(validateEditor(sample,v),null);
  assert.match(validateEditor(sample,{...v,discount:''}),/backend aún no permite quitar un descuento/);
  assert.match(validateEditor(sample,{...v,initDate:''}),/backend aún no permite borrar fechas/);
  assert.equal(validateEditor(sample,{...v,isFree:true,discount:''}),null);
  assert.equal(courseUpdateForm({...v,isFree:true}).get('price'),'0');
  assert.equal(courseUpdateForm({...v,isFree:true}).has('discount_price'),false);
});
