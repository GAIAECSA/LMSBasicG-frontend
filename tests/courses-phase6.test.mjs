import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import {enabledCourseCodes,parseCategory,parseSubcategory,parseCourse,parseList,parseTransition} from '../lib/academic/types.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=(p)=>readFileSync(resolve(root,p),'utf8');
const course={id:17,name:'Álgebra',description:'Curso de ejemplo',price:'20.00',discount_price:null,
 is_free:false,level:'PRINCIPIANTE',is_published:false,open_enrollment:false,duration_hours:20,total_lessons:4,
 image_url:null,currency:'USD',published_at:null,total_students:0,grade_calculation_method:'AVERAGE',
 init_date:null,finish_date:null,subcategory_id:4,course_type_id:2,
 course_type:{id:2,code:'MOOC',name:'MOOC'},certificate_types:[]};

test('códigos de plan son exactos y fallan cerrado',()=>{
 assert.deepEqual(enabledCourseCodes([{id:1,code:'MOOC',name:'Propio',description:null,config:{} }]),['MOOC']);
 assert.deepEqual(enabledCourseCodes([{id:1,code:'MOOC_EXTRA',name:'Propio',description:null,config:{}}]),[]);
 assert.deepEqual(enabledCourseCodes([{id:1,code:'PLAN_MDT',name:'MDT',description:null,config:{}}],{MOOC:'PLAN_MOOC',MDT:'PLAN_MDT'}),['MDT']);
 assert.deepEqual(enabledCourseCodes([], {MOOC:'MOOC',MDT:'MDT'}),[]);
});
test('parsers rechazan estructuras incompletas y campos no válidos',()=>{
 assert.deepEqual(parseCategory({id:1,name:'Arte'}),{id:1,name:'Arte'});
 assert.equal(parseCategory({id:0,name:'Arte'}),null);
 assert.deepEqual(parseSubcategory({id:2,name:'Tejido',category_id:1}),{id:2,name:'Tejido',category_id:1});
 assert.equal(parseCourse({...course,course_type_id:777}),null);
 assert.equal(parseCourse({...course,price:'no permitido'}),null);
 assert.equal(parseCourse({...course,grade_calculation_method:'SUM'}),null);
 assert.deepEqual(parseList([course],parseCourse)?.[0]?.course_type.code,'MOOC');
 assert.equal(parseList([course,{...course,id:null}],parseCourse),null);
});
test('preview requiere toda la información crítica',()=>{
 const p={course_id:17,current_type:course.course_type,target_type:{id:3,code:'MDT',name:'MDT'},
  blocks_to_create:[],blocks_to_reactivate:[],blocks_to_deactivate:[],blocks_to_preserve:[],
  certificate_types_to_create:[],certificate_types_to_reactivate:[],certificate_types_to_deactivate:[],
  manual_blocks_untouched:0,automatic_certificates_to_provision:0,
  existing_automatic_certificates_untouched:0,attendance_rows_to_provision:0,data_will_be_deleted:false};
 assert.equal(parseTransition(p)?.target_type.code,'MDT');
 assert.equal(parseTransition({...p,blocks_to_deactivate:'desconocido'}),null);
});
test('el menú reemplaza matrículas globales y cursos y contenidos por Cursos con tres enlaces',()=>{
 const shell=file('components/campus/campus-shell.tsx');
 assert.doesNotMatch(shell,/Cursos y contenidos|Matrículas y notas/);
 for(const part of ['/campus/categories','/campus/subcategories','/campus/courses'])assert.ok(shell.includes(part));
 assert.match(shell,/\{admin && <>/);
});
test('las páginas y API validan admin y pendientes',()=>{
 for(const name of ['categories','subcategories','courses']){
  const page=file(`app/campus/${name}/page.tsx`);
  assert.match(page,/isTenantAdmin\(state.user.role\)/);
  assert.match(page,/state.status==='pending'/);
 }
 const detail=file('app/campus/courses/[id]/page.tsx');
 assert.match(detail,/isTenantAdmin/);
 const auth=file('lib/academic/bff.ts');
 assert.match(auth,/authState\(await resolveTenant\(\),token\)/);
 assert.match(auth,/sameOriginRequest/);
});
test('crear curso impone borrador, tipo permitido y no asigna docente',()=>{
 const form=file('lib/academic/course-form.ts');
 assert.match(form,/k==='is_published'&&mode==='create'/);
 assert.match(form,/cleaned.set\(k,'false'\)/);
 const route=file('app/api/academic/courses/route.ts');
 assert.match(route,/ctx.allowed.includes\(type.code\)/);
 assert.doesNotMatch(file('components/campus/admin-courses.tsx'),/Asignar docente/);
});
test('cambio de tipo usa preview y confirmación, nota solo endpoint especial',()=>{
 const d=file('components/campus/admin-course-detail.tsx');
 assert.match(d,/type-preview/);
 assert.match(d,/type-change/);
 assert.match(d,/grade-method/);
 const route=file('app/api/academic/courses/[id]/grade-method/route.ts');
 assert.match(route,/quiz\/courses\/\$\{id\}\/grade-method/);
 const preview=file('app/api/academic/courses/[id]/type-preview/route.ts');
 assert.match(preview,/ctx.allowed.includes\(type.code\)/);
 const change=file('app/api/academic/courses/[id]/type-change/route.ts');
 assert.match(change,/payload.confirm!==true/);
});
test('el proxy solo acepta imagen pública y reconocida del tenant',()=>{
 const route=file('app/api/academic/courses/[id]/image/route.ts');
 assert.match(route,/ctx.tenantId/);
 assert.match(route,/course.is_published/);
 assert.match(route,/image\/png/);
});
test('archivos críticos están presentes',()=>{
 for(const name of ['app/api/academic/categories/[id]/route.ts','app/api/academic/subcategories/[id]/route.ts',
  'app/api/academic/courses/[id]/route.ts','app/api/academic/courses/[id]/type-change/route.ts',
  'components/campus/admin-taxonomy.tsx','components/campus/admin-courses.tsx'])
  assert.ok(existsSync(resolve(root,name)),name);
});
