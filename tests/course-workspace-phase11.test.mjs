import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const {schedulePreview}=await import('../lib/course-workspace/attendance-schedule.ts');
const {rowsFromSpanishTable,matchKnownUser,personError,blankPerson}=await import('../lib/course-workspace/bulk-enrollment.ts');

const defaultSlots=()=>Object.fromEntries(Array.from({length:7},(_,i)=>[i,{enabled:i===1||i===3,start:'18:00',end:'20:00'}]));
test('recurrencia semanal sin zonas horarias ni fines de semana',()=>{
  const result=schedulePreview({from:'2026-11-02',to:'2026-11-16',slots:defaultSlots(),exclusions:''},[]);
  assert.equal(result.error,null);assert.deepEqual(result.rows.map(r=>r.day),[
    '2026-11-02','2026-11-04','2026-11-09','2026-11-11','2026-11-16']);
});
test('excluye feriados y sesiones existentes',()=>{
  const result=schedulePreview({from:'2026-11-02',to:'2026-11-16',slots:defaultSlots(),exclusions:'2026-11-04'},[
    {day:'2026-11-02',start_time:'18:00:00',end_time:'20:00:00'}]);
  assert.equal(result.error,null);assert.equal(result.duplicates,1);
  assert.deepEqual(result.rows.map(r=>r.day),['2026-11-09','2026-11-11','2026-11-16']);
});
test('rechaza periodos inválidos y horarios invertidos',()=>{
  const slots=defaultSlots();slots[1]={enabled:true,start:'19:00',end:'18:00'};
  assert.match(schedulePreview({from:'2026-11-02',to:'2026-11-16',slots,exclusions:''},[]).error,/horario/i);
  assert.match(schedulePreview({from:'2026-11-31',to:'2026-12-01',slots:defaultSlots(),exclusions:''},[]).error,/fecha/i);
  assert.match(schedulePreview({from:'2026-11-02',to:'2028-11-16',slots:defaultSlots(),exclusions:''},[]).error,/366/);
});
test('encabezados españoles y rol por fila importados desde Excel',()=>{
  const rows=rowsFromSpanishTable([
    ['Usuario','Contraseña','Nombres','Apellidos','Cédula','Correo','Teléfono','Provincia','Rol'],
    ['jperez','Temporal123!','Juan','Pérez','0102030405','juan@test.org','099999','Chimborazo','Estudiante'],
    ['mlopez','Temporal123!','María','López','0202030405','maria@test.org','098888','Guayas','Profesor'],
  ]);
  assert.equal(rows.length,2);assert.equal(rows[0].idnumber,'0102030405');
  assert.equal(rows[0].role_code,'STUDENT');assert.equal(rows[1].role_code,'TEACHER');
  assert.throws(()=>rowsFromSpanishTable([['username','password']]),/Usuario/);
});
test('no reutiliza usuarios que solo coinciden por nombre de usuario',()=>{
  const row={...blankPerson(),username:'jperez',firstname:'Juan',lastname:'Pérez',idnumber:'0102030405',email:'juan@test.org'};
  const existing=[{id:7,username:'jperez',firstname:'Otro',lastname:'Pérez',idnumber:'0102030405',email:'juan@test.org',is_active:true}];
  assert.match(matchKnownUser(row,existing).error,/no coinciden/i);
  assert.equal(matchKnownUser(row,[{...existing[0],firstname:'Juan'}]).user.id,7);
  assert.match(personError({...row,email:'sin-arroba'}),/correo/i);
});
test('el SSR vincula las nuevas vistas a sus permisos de aula',()=>{
  const page=read('app/campus/courses/[id]/[section]/page.tsx');
  assert.match(page,/section==='attendance'/);
  assert.match(page,/section==='enrollments'/);
  assert.match(page,/ws\.role!=='ADMIN'/);
  const api=read('app/api/course-workspace/[id]/[...resource]/route.ts');
  assert.match(api,/getCourseWorkspace/);assert.match(api,/adminOnly/);assert.match(api,/sessionInCourse/);
  assert.match(api,/sameOriginRequest|mutation\(request/);
  assert.match(api,/\/api\/v1\/enrollments\/admin/);
  assert.match(api,/\/api\/v1\/course-attendance/);
});
test('la vista no introduce branding institucional fijo ni dependencias npm nuevas',()=>{
  const css=read('app/globals.css').split('/* Fase 11')[1];
  assert.ok(css);assert.match(css,/var\(--tenant-primary\)/);
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.dependencies.xlsx,undefined);assert.equal(pkg.dependencies.exceljs,undefined);
  assert.ok(fs.existsSync(path.join(root,'public/plantilla_matricula_es.xlsx')));
});
