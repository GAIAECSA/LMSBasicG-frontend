import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  courseGradesUrl,displayGrade,displayWeight,gradeCellLabel,
  readCourseGradesMatrix,defaultGradeQuery,
} from '../lib/course-workspace/grades.ts';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');
const quiz={lesson_block_id:101,title:'Evaluación uno',kind:'quiz',counts_toward_grade:true,
  grade_weight:'2.0000',module_id:10,module_name:'Módulo 1',lesson_id:20,lesson_name:'Lección A'};
const homework={lesson_block_id:102,title:'Ensayo',kind:'homework',counts_toward_grade:false,
  grade_weight:'1.0000',module_id:10,module_name:'Módulo 1',lesson_id:20,lesson_name:'Lección A'};
const student={enrollment_id:6,user_id:2,firstname:'María',lastname:'Pérez',username:'mperez',email:'mperez@example.org',
  final_grade:'0.00',grades:[
    {lesson_block_id:101,score:'0.00',status:'CALIFICADO'},
    {lesson_block_id:102,score:null,status:'ENTREGADO'},
  ]};
const matrix={course_id:1,course_name:'Curso MDT',grade_calculation_method:'WEIGHTED',grade_scale_max:10,
  page:1,page_size:25,total_students:1,activity_page:1,activity_page_size:15,
  total_activities:2,total_course_activities:2,total_counted_activities:1,
  activities:[quiz,homework],students:[student]};

test('contrato de calificaciones conserva Decimal, cero real, notas finales y exclusión',()=>{
  const value=readCourseGradesMatrix(matrix,1);
  assert.equal(value.grade_calculation_method,'WEIGHTED');
  assert.equal(value.students[0].final_grade,'0.00');
  assert.equal(value.students[0].grades[0].score,'0.00');
  assert.equal(value.activities[1].counts_toward_grade,false);
  assert.equal(displayGrade(value.students[0].final_grade),'0.00');
  assert.equal(displayGrade(null),'—');
  assert.equal(displayWeight('2.0000'),'2');
  assert.equal(gradeCellLabel(value.students[0].grades[1]),'Entregado');
});
test('rechaza bloques raíz, PDF, Forum y lección inválida, aunque tengan nota',()=>{
  assert.throws(()=>readCourseGradesMatrix({...matrix,activities:[{...quiz,lesson_id:null},homework]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,activities:[{...quiz,kind:'pdf'},homework]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,activities:[{...quiz,kind:'forum'},homework]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,activities:[{...quiz,lesson_id:0},homework]},1),/inválida/);
});
test('rechaza notas inconsistentes, ceros simulados y celdas no correspondientes',()=>{
  assert.throws(()=>readCourseGradesMatrix({...matrix,students:[{...student,grades:[
    {lesson_block_id:101,score:null,status:'CALIFICADO'},student.grades[1]]}]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,students:[{...student,grades:[
    {lesson_block_id:101,score:'0.00',status:'SIN_INTENTAR'},student.grades[1]]}]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,students:[{...student,grades:[
    student.grades[0],{...student.grades[1],lesson_block_id:101}]}]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,students:[{...student,final_grade:11}]},1),/inválida/);
  assert.throws(()=>readCourseGradesMatrix({...matrix,students:[{...student,grades:[
    student.grades[0],{...student.grades[1],status:'SIN_INTENTAR'}]}]},1),/inválida/);
});
test('permite estudiantes o actividades vacías sin convertir notas pendientes en cero',()=>{
  assert.equal(readCourseGradesMatrix({...matrix,students:[],total_students:0},1).students.length,0);
  const withoutActivities={...matrix,activities:[],total_activities:0,total_course_activities:0,total_counted_activities:0,
    students:[{...student,final_grade:null,grades:[]}]};
  assert.equal(readCourseGradesMatrix(withoutActivities,1).students[0].final_grade,null);
  assert.throws(()=>readCourseGradesMatrix({...matrix,course_id:2},1),/inválida/);
});
test('URL de consulta pagina estudiantes y actividades por separado',()=>{
  const url=courseGradesUrl(13,{...defaultGradeQuery,page:3,activity_page:4,activity_type:'homework',
    activity_filter:'NOT_COUNTED',search:'María Pérez'});
  assert.ok(url.startsWith('/api/courses/13/grades?'));
  const parsed=new URL(url,'http://localhost');
  assert.equal(parsed.searchParams.get('page'),'3');
  assert.equal(parsed.searchParams.get('activity_page'),'4');
  assert.equal(parsed.searchParams.get('search'),'María Pérez');
  assert.equal(parsed.searchParams.get('activity_filter'),'NOT_COUNTED');
});
test('BFF de solo lectura valida roles, tenant, filtros y resultado FastAPI',()=>{
  const bff=read('app/api/courses/[id]/grades/route.ts');
  assert.match(bff,/export async function GET/);
  assert.doesNotMatch(bff,/export async function (POST|PUT|PATCH|DELETE)/);
  assert.match(bff,/getCourseWorkspace\(courseId\)/);
  assert.match(bff,/workspace\.role==='STUDENT'/);
  assert.match(bff,/SESSION_COOKIE/);
  assert.match(bff,/\/api\/v1\/courses\/\$\{courseId\}\/grades/);
  assert.match(bff,/readCourseGradesMatrix/);
  assert.match(bff,/page_size/);assert.match(bff,/activity_page_size/);
  assert.doesNotMatch(bff,/NEXT_PUBLIC_BACKEND|business_id=|user_id=|role_id=/);
  assert.match(read('lib/academic/bff.ts'),/private, no-store/);
});
test('la pantalla conserva solo lectura, notas del servidor y diseño responsive',()=>{
  const page=read('app/campus/courses/[id]/[section]/page.tsx');
  const component=read('components/campus/course-grades.tsx');
  const css=read('components/campus/course-grades.module.css');
  assert.match(page,/if\(section==='grades'\)return <CourseGrades/);
  assert.match(read('lib/course-workspace/navigation.ts'),/section:'grades'/);
  assert.match(component,/readCourseGradesMatrix/);
  assert.match(component,/activity_filter/);assert.match(component,/activity_page/);
  assert.match(component,/Nota final/);assert.match(component,/Sin notas/);
  assert.match(component,/GradeCards/);assert.match(component,/GradeTable/);
  assert.doesNotMatch(component,/method:\s*['"](POST|PUT|PATCH|DELETE)|grade_weight\s*\*/);
  assert.match(css,/position:sticky/);assert.match(css,/@media\(max-width:760px\)/);
  assert.match(css,/var\(--tenant-accent-ink\)/);
  assert.doesNotMatch(css,/#(?:2563eb|3b82f6|1d4ed8)/i);
});
