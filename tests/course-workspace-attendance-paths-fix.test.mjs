import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {attendanceApi,enrichAttendanceRoles} from '../lib/course-workspace/attendance-api.ts';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const route=fs.readFileSync(path.join(root,'app/api/course-workspace/[id]/[...resource]/route.ts'),'utf8');
const backendSessions='/api/v1/course_attendance/course-attendance';
const backendAttendance='/api/v1/attendance/attendance';

test('cada operación de sesión utiliza las rutas reales del backend (MOOC y MDT)',()=>{
  assert.equal(attendanceApi.course(1),`${backendSessions}/course/1`);
  assert.equal(attendanceApi.session(15),`${backendSessions}/15`);
  assert.equal(attendanceApi.createSession,backendSessions);
  assert.equal(attendanceApi.recurringPreview,`${backendSessions}/recurring/preview`);
  assert.equal(attendanceApi.recurring,`${backendSessions}/recurring`);
});

test('detalle de asistencia, listado y PUT de estados usan doble prefijo attendance',()=>{
  assert.equal(attendanceApi.records(14),`${backendAttendance}/course-attendance/14`);
  assert.equal(attendanceApi.record(88),`${backendAttendance}/88`);
});

test('el BFF usa el contrato centralizado para todos los métodos sin rutas antiguas',()=>{
  const required=[
    'attendanceApi.course(ctx.courseId)',
    'attendanceApi.session(sessionId)',
    'attendanceApi.records(sid)',
    'attendanceApi.createSession',
    'attendanceApi.recurringPreview',
    'attendanceApi.recurring',
    'attendanceApi.session(sid)',
    'attendanceApi.record(recordId)',
  ];
  for(const expression of required)assert.ok(route.includes(expression),`Falta: ${expression}`);
  assert.doesNotMatch(route,/\/api\/v1\/course-attendance/);
  assert.doesNotMatch(route,/\/api\/v1\/attendance\/course-attendance/);
  assert.match(route,/sessionInCourse\(ctx,sid\)/);
  assert.match(route,/getCourseWorkspace/);
  assert.match(route,/mutation\(request/);
});

test('ADMIN identifica estudiantes y profesores por matrícula del curso',()=>{
  const enrollments=[
    {id:1,course:{id:7},role:{id:20,code:'STUDENT'},status:'ACEPTADO'},
    {id:2,course:{id:7},role:{id:21,code:'TEACHER'},status:'ACEPTADO'},
    {id:3,course:{id:8},role:{id:21,code:'TEACHER'},status:'ACEPTADO'},
  ];
  const rows=[{id:5,enrollment_id:1,role_id:20},{id:6,enrollment_id:2,role_id:21}];
  const result=enrichAttendanceRoles(rows,enrollments,7,'ADMIN');
  assert.deepEqual(result,[{...rows[0],role_code:'STUDENT'},{...rows[1],role_code:'TEACHER'}]);
});

test('TEACHER distingue otros profesores y estudiantes sin acceso a matrícula administrativa',()=>{
  const enrollments=[
    {id:41,course:{id:7},role:{id:21,code:'TEACHER'},status:'ACEPTADO'},
    {id:42,course:{id:8},role:{id:20,code:'STUDENT'},status:'ACEPTADO'},
  ];
  const rows=[
    {id:1,enrollment_id:41,role_id:21},
    {id:2,enrollment_id:43,role_id:21},
    {id:3,enrollment_id:44,role_id:20},
  ];
  const result=enrichAttendanceRoles(rows,enrollments,7,'TEACHER');
  assert.deepEqual(result,[
    {...rows[0],role_code:'TEACHER'},
    {...rows[1],role_code:'TEACHER'},
    {...rows[2],role_code:'STUDENT'},
  ]);
  assert.match(route,/ctx\.role==='ADMIN'/);
  assert.match(route,/\/api\/v1\/enrollments\/me/);
  assert.match(route,/\/api\/v1\/enrollments\/\?course_id=/);
});

test('sin matrícula TEACHER aceptada en el curso no se infiere ni inventa el rol de terceros',()=>{
  const enrollments=[
    {id:2,course:{id:10},role:{id:21,code:'TEACHER'},status:'ACEPTADO'},
    {id:3,course:{id:7},role:{id:21,code:'TEACHER'},status:'CANCELADO'},
  ];
  const result=enrichAttendanceRoles([{id:4,enrollment_id:15,role_id:20}],enrollments,7,'TEACHER');
  assert.deepEqual(result,[{id:4,enrollment_id:15,role_id:20,role_code:null}]);
});
