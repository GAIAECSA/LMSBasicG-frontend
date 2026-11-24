import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPORT_CODES, REPORT_GROUPS, TITLES, GRADE_CODES, parseReportCatalog, reportUrl } from '../lib/course-reports/catalog.ts';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const quiz={id:91,title:'Quiz',type:'quiz',counts_toward_grade:true};
const demo={course_id:9,course_name:'MDT',reports:REPORT_CODES.map(code=>({code,title:TITLES[code],category:'MDT'})),
  activities:[quiz,{id:92,title:'Tarea',type:'homework',counts_toward_grade:true},
    {id:93,title:'Diagnóstico',type:'quiz',counts_toward_grade:false}],
  defaults:{diagnostic:[93],practical:[92],theoretical:[91],'final-grades':[91,92]}};

test('Hay 14 reportes únicos en seis categorías del curso',()=>{
  assert.equal(REPORT_CODES.length,14);
  assert.equal(REPORT_GROUPS.length,6);
  assert.deepEqual(REPORT_GROUPS.flatMap(x=>x.reports),REPORT_CODES);
  assert.deepEqual(GRADE_CODES,['diagnostic','practical','theoretical','final-grades']);
});
test('Catálogo solo admite datos consistentes, curso correcto e IDs válidos',()=>{
  assert.deepEqual(parseReportCatalog(demo,9)?.defaults['final-grades'],[91,92]);
  assert.equal(parseReportCatalog(demo,8),null);
  assert.equal(parseReportCatalog({...demo,activities:[quiz,quiz]},9),null);
  assert.equal(parseReportCatalog({...demo,defaults:{...demo.defaults,practical:[1000]}},9),null);
});
test('Descarga privada no filtra token y transmite solamente IDs de actividad',()=>{
  const p=new URL(reportUrl(9,'final-grades',[91,92]),'http://localhost');
  assert.equal(p.pathname,'/api/course-reports/9/final-grades/pdf');
  assert.deepEqual(p.searchParams.getAll('activity_ids'),['91','92']);
  assert.doesNotMatch(p.href,/token|business_id|role_id/i);
});
test('La página de reportes exige ADMIN y modalidad MDT',()=>{
  const page=read('app/campus/courses/[id]/[section]/page.tsx');
  assert.match(page,/section==='reports'&&ws\.role==='ADMIN'&&ws\.code==='MDT'/);
  const bff=read('app/api/course-reports/[id]/[...resource]/route.ts');
  assert.match(bff,/getCourseWorkspace\(Number\(id\)\)/);
  assert.match(bff,/SESSION_COOKIE/);
  assert.match(bff,/workspace\.role!=='ADMIN'\|\|state\.workspace\.code!=='MDT'/);
  assert.doesNotMatch(bff,/NEXT_PUBLIC_BACKEND|localStorage/);
  assert.match(bff,/Cache-Control.*no-store/);
});
test('Selección de notas es efímera y la nota final mantiene actividades obligatorias',()=>{
  const component=read('components/campus/course-reports.tsx');
  assert.match(component,/mandatory=\(code:ReportCode,a:ReportActivity\)/);
  assert.match(component,/code==='final-grades'&&a\.counts_toward_grade/);
  assert.match(component,/selected,setSelected/);
  assert.match(component,/No se guarda ninguna preferencia/);
  assert.doesNotMatch(component,/localStorage|sessionStorage|cookies\(/);
});
