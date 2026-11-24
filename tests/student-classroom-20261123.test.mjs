/** Pruebas de contratos y seguridad de integración del aula STUDENT.
 * Sin deps npm: node --experimental-strip-types --test tests/*.test.mjs
 * Complementan, NO sustituyen, los tests E2E de Next+FastAPI+PostgreSQL.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(f)=>readFileSync(resolve(base,f),'utf8');
const route=read('app/api/student-courses/[id]/[...resource]/route.ts');
const course=read('components/campus/student-course.tsx');
const content=read('components/campus/student-course-content.tsx');
const activities=read('components/campus/student-course-activities.tsx');
const certificate=read('components/campus/student-course-certificate.tsx');

test('sólo STUDENT aceptado entra al aula; curso no publicado no revoca matrícula',()=>{
  const server=read('lib/course-workspace/server.ts');
  assert.match(server,/item\.status==='ACEPTADO'/);
  assert.match(server,/enrollment\.role\.code==='STUDENT'/);
  assert.match(server,/student-courses\/\$\{courseId\}\/overview/);
  assert.doesNotMatch(server,/if\(!enrollment\.course\.is_published\)/);
  assert.match(route,/workspace\.role!=='STUDENT'/);
  assert.match(route,/SESSION_COOKIE/);
});

test('código MOOC/MDT y cuatro secciones exclusivas conservan el menú campus',()=>{
  const page=read('app/campus/courses/[id]/page.tsx');
  const section=read('app/campus/courses/[id]/[section]/page.tsx');
  const layout=read('app/campus/courses/[id]/layout.tsx');
  assert.match(page,/\/summary/);
  assert.match(section,/isStudentSection/);
  assert.match(section,/StudentCourse/);
  assert.match(layout,/workspace\.role==='STUDENT'\?undefined/);
  for(const label of ['summary','content','grades','certificate'])assert.match(course,new RegExp(`section:'${label}'`));
  assert.doesNotMatch(course,/Próximas actividades|Ver certificado|Ir al contenido/);
});

test('BFF es una allowlist sin rutas abiertas para IDOR ni token en el navegador',()=>{
  assert.match(route,/function allowBlock/);
  assert.match(route,/function allowSurvey/);
  assert.match(route,/function allowHomework/);
  assert.match(route,/async function ownAttempt/);
  assert.match(route,/sameOriginRequest/);
  assert.match(route,/student-courses\/\$\{ctx\.id\}\/eligibility/);
  assert.match(route,/if\(!upstream\)return resp\(404/);
  assert.doesNotMatch(route,/request\.nextUrl\.pathname.*apiFetch|process\.env\.NEXT_PUBLIC.*TOKEN|localStorage/);
});

test('progreso de recursos sólo lectura al abrir; Quiz/Tarea/Encuesta/Foro guardan su propio evento',()=>{
  assert.match(content,/\['text','image','pdf','video'\]/);
  assert.match(content,/\['blocks',selected,'complete'\]/);
  assert.match(activities,/\['quiz',block\.id,'start'\]/);
  assert.match(activities,/\['homework',block\.id,'submission'\]/);
  assert.match(activities,/\['survey',surveyId,'submit'\]/);
  assert.match(activities,/\['forum',block\.id,'posts'\]/);
  assert.match(route,/allowBlock\(ctx,a,\['text','image','pdf','video'\]\)/);
});

test('Quiz usa una pregunta a la vez, permite volver y sólo envía las respuestas del intento',()=>{
  assert.match(activities,/Pregunta \{step\+1\} de \{questions\.length\}/);
  assert.match(activities,/onClick=\{\(\)=>setStep\(i\)\}/);
  assert.match(activities,/onClick=\{\(\)=>setStep\(i=>i-1\)\}/);
  assert.match(activities,/\['quiz',block\.id,'attempts',attempt\.id,'submit'\]/);
  assert.doesNotMatch(route,/correct_answer|\/blocks\/\$\{a\}\/questions/);
});

test('encuestas Likert 5 y únicas, foro anidado, documentos MDT no generan nota',()=>{
  assert.match(activities,/Muy en desacuerdo/);
  assert.match(activities,/Muy de acuerdo/);
  assert.match(activities,/mine\?\.submitted/);
  assert.match(activities,/parent_id/);
  assert.match(activities,/isPdfFile\(f\)/);
  assert.match(activities,/Documento obligatorio MDT/);
  assert.match(route,/ctx\.overview\.documents\.some/);
});

test('calificaciones y certificados siempre leen autoridad académica de FastAPI',()=>{
  assert.match(course,/grades\.method==='AVERAGE'/);
  assert.match(course,/grades\.final_grade/);
  assert.match(certificate,/eligibility\.academic_eligible/);
  assert.match(certificate,/eligibility\.can_generate/);
  assert.match(certificate,/eligibility\.can_download/);
  assert.match(certificate,/cert\.type==='MDT'/);
  assert.match(route,/\/api\/v1\/certificates\/\$\{b\}\/generate/);
  assert.match(route,/\/api\/v1\/external-certificates\/\$\{b\}/);
  assert.doesNotMatch(course,/reduce\([^\n]*grade_weight/);
});

test('estilos institucionales multitenant; HTML sin scripts y recursos privados',()=>{
  const style=read('components/campus/student-course.module.css');
  const html=read('lib/student-course/domain.ts');
  assert.match(style,/--tenant-primary/);
  assert.match(style,/--tenant-on-primary/);
  assert.match(style,/--tenant-accent-ink/);
  assert.match(style,/@media\(max-width:760px\)/);
  assert.match(content,/sandbox=""/);
  assert.match(content,/default-src 'none'/);
  assert.match(content,/youtube-nocookie\.com\/embed/);
  assert.match(html,/parseStudentOverview/);
  assert.doesNotMatch([course,content,activities,certificate].join('\n'),/localStorage|document\.cookie|Bearer\s/);
});
