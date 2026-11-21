import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(name)=>fs.readFileSync(path.join(root,name),'utf8');
const {recurringPayload,jsDayToPython,existingBatchPayload,massiveBatchPayload,
  readBatchResult,readRecurringPreview,readRecurringCreation}=await import('../lib/course-workspace/phase12-contract.ts');
const {blankPerson,rowsFromSpanishTable}=await import('../lib/course-workspace/bulk-enrollment.ts');
const week=()=>Object.fromEntries(Array.from({length:7},(_,day)=>[day,{enabled:day===0||day===1||day===6,start:'18:00',end:'20:00'}]));
test('días en Python: lunes 0, sábado 5 y domingo 6',()=>{
  assert.equal(jsDayToPython(1),0);assert.equal(jsDayToPython(6),5);assert.equal(jsDayToPython(0),6);
  const request=recurringPayload(9,'2026-12-01','2027-01-31',week(),'2026-12-25;2027-01-01');
  assert.deepEqual(request.weekly.map(v=>v.weekday),[0,5,6]);
  assert.deepEqual(request.excluded_dates,['2026-12-25','2027-01-01']);
  assert.equal(request.course_id,9);assert.equal(request.skip_existing,true);
});
test('recurrencia rechaza horarios, fechas y exclusiones fuera del período',()=>{
  assert.throws(()=>recurringPayload(9,'2026-11-20','2026-11-25',week(),'2026-12-01'),/exclusiones/i);
  assert.throws(()=>recurringPayload(9,'2026-11-31','2026-12-01',week(),''),/fechas/i);
  const slots=week();slots[1].end='17:00';
  assert.throws(()=>recurringPayload(9,'2026-11-20','2026-11-25',slots,''),/horarios/i);
});
test('matrícula de usuarios existentes en una petición y rol por entrada',()=>{
  assert.deepEqual(existingBatchPayload(8,[{id:4,role_code:'STUDENT'},{id:5,role_code:'TEACHER'}]),{
    course_id:8,enrollments:[{course_id:8,user_id:4,role_code:'STUDENT'},{course_id:8,user_id:5,role_code:'TEACHER'}]
  });
  assert.throws(()=>existingBatchPayload(8,[{id:4,role_code:'STUDENT'},{id:4,role_code:'TEACHER'}]),/duplicado/i);
});
test('importación conserva cédula como identidad aunque los demás campos estén vacíos o sean incorrectos',()=>{
  const existing={...blankPerson(),idnumber:' 0102030405 ',username:'otro_nombre',email:'error-sin-arroba',password:'x',role_code:'TEACHER'};
  const payload=massiveBatchPayload(16,[existing]);
  assert.equal(payload.users[0].idnumber,'0102030405');
  assert.equal(payload.users[0].username,'otro_nombre');
  assert.equal(payload.users[0].email,'error-sin-arroba');
  assert.equal(payload.users[0].role_code,'TEACHER');
  assert.equal(payload.users[0].password,'x'); // Backend ignora si la cédula existe.
  assert.equal(massiveBatchPayload(16,[{...blankPerson(),idnumber:'0102030406'}]).users[0].username,null);
});
test('importación limita 300 y detecta cédulas duplicadas',()=>{
  const row={...blankPerson(),idnumber:'0102030405'};
  assert.throws(()=>massiveBatchPayload(1,[row,row]),/duplicada/i);
  assert.throws(()=>massiveBatchPayload(1,[blankPerson()]),/cédula/i);
  assert.throws(()=>massiveBatchPayload(1,Array.from({length:301},(_,i)=>({...row,idnumber:String(i)}))),/300/i);
  const excel=[['Usuario','Contraseña','Nombres','Apellidos','Cédula','Correo','Teléfono','Provincia','Rol'],...Array.from({length:301},(_,i)=>['','','','',String(i),'','','',''])];
  assert.throws(()=>rowsFromSpanishTable(excel),/300/i);
});
test('interpreta resultados transaccionales sin declarar éxitos antes de confirmación',()=>{
  const batch=readBatchResult({created:[{row:1,user_id:9,role_code:'STUDENT'}],reactivated:[],skipped:[],failed:[],summary:{total:1,created:1,reactivated:0,skipped:0,failed:0}});
  assert.equal(batch.summary.created,1);
  assert.throws(()=>readBatchResult({created:[]}),/inválido/i);
  assert.equal(readRecurringPreview({total_generated:2,to_create:[],existing:[],excluded:[]}).total_generated,2);
  assert.equal(readRecurringCreation({created:[],skipped_existing:2,total_generated:2}).skipped_existing,2);
});
test('BFF aplica permisos, tamaños de lote y redirige exactamente a la fase 12',()=>{
  const route=read('app/api/course-workspace/[id]/[...resource]/route.ts');
  assert.match(route,/getCourseWorkspace/);assert.match(route,/adminOnly/);
  assert.match(route,/maxBytes=8192/);assert.match(route,/batchOperation\?350000:8192/);
  assert.match(route,/\/api\/v1\/enrollments\/admin\/bulk/);
  assert.match(route,/\/api\/v1\/enrollments\/massive/);
  assert.match(route,/\/api\/v1\/users\/search/);
  assert.match(route,/\/api\/v1\/course_attendance\/course-attendance\/recurring\/preview/);
  assert.match(route,/\/api\/v1\/course_attendance\/course-attendance\/recurring/);
  assert.match(route,/role_code:'VISITOR'/);
  assert.match(route,/mutation\(request/);
});
test('vistas usan una petición por lote; no hacen provisioning de usuario individual',()=>{
  const enrollment=read('components/campus/course-enrollments-manager.tsx');
  const attendance=read('components/campus/course-attendance-manager.tsx');
  assert.match(enrollment,/existingBatchPayload/);
  assert.match(enrollment,/massiveBatchPayload/);
  assert.match(enrollment,/\/bulk/);assert.match(enrollment,/\/massive/);
  assert.doesNotMatch(enrollment,/requestJson\('\/api\/users'/);
  assert.match(attendance,/previewRecurrence/);
  assert.match(attendance,/readRecurringCreation/);
  assert.doesNotMatch(attendance,/for\(const item of fresh.rows\)/);
  assert.match(attendance,/confirmedPreview/);
});
