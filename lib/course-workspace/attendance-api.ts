/** Rutas de FastAPI comprobadas con app/api/router.py y sus dos routers.
 * No alterar sus prefijos: course_attendance (guion bajo) / course-attendance
 * y attendance / attendance son rutas diferentes de las URLs del BFF Next.js.
 */
const SESSIONS='/api/v1/course_attendance/course-attendance';
const ATTENDANCES='/api/v1/attendance/attendance';

export const attendanceApi={
  course:(courseId:number)=>`${SESSIONS}/course/${courseId}`,
  session:(sessionId:number)=>`${SESSIONS}/${sessionId}`,
  createSession:SESSIONS,
  recurringPreview:`${SESSIONS}/recurring/preview`,
  recurring:`${SESSIONS}/recurring`,
  records:(sessionId:number)=>`${ATTENDANCES}/course-attendance/${sessionId}`,
  record:(recordId:number)=>`${ATTENDANCES}/${recordId}`,
} as const;

const isRecord=(value:unknown):value is Record<string,unknown>=>
  value!==null&&typeof value==='object'&&!Array.isArray(value);
const positiveId=(value:unknown):value is number=>Number.isSafeInteger(value)&&Number(value)>0;
type CourseRole='STUDENT'|'TEACHER';

/** Completa el código de rol para mostrar filtros fiables sin conceder permisos.
 * ADMIN obtiene las matrículas del curso. TEACHER solo puede consultar /enrollments/me.
 * FastAPI limita los roles COURSE a STUDENT y TEACHER; desde el role.id del propio
 * profesor aceptado se puede discriminar a los estudiantes de la sesión. Ante un
 * DTO inconsistente o una matrícula de otro curso, se devuelve null, no se inventa.
 */
export function enrichAttendanceRoles(
  attendances:unknown[],enrollments:unknown[],courseId:number,caller:'ADMIN'|'TEACHER',
):unknown[] {
  const byEnrollment=new Map<number,CourseRole>();
  const byRoleId=new Map<number,CourseRole>();
  let teacherRoleId:number|null=null;
  for(const raw of enrollments){
    if(!isRecord(raw)||!isRecord(raw.course)||raw.course.id!==courseId||
      !isRecord(raw.role)||!positiveId(raw.id)||!positiveId(raw.role.id))continue;
    const code=raw.role.code;
    if(code!=='STUDENT'&&code!=='TEACHER')continue;
    byEnrollment.set(raw.id,code);
    byRoleId.set(raw.role.id,code);
    if(caller==='TEACHER'&&code==='TEACHER'&&raw.status==='ACEPTADO')teacherRoleId=raw.role.id;
  }
  return attendances.map(raw=>{
    if(!isRecord(raw))return raw;
    const explicit=positiveId(raw.enrollment_id)?byEnrollment.get(raw.enrollment_id):undefined;
    const known=positiveId(raw.role_id)?byRoleId.get(raw.role_id):undefined;
    // Como el esquema vigente únicamente asigna STUDENT/TEACHER a Enrollment,
    // un role_id distinto del TEACHER aceptado del mismo curso es STUDENT.
    // Sin TEACHER verificado, no hacemos esa inferencia.
    const student=caller==='TEACHER'&&teacherRoleId!==null&&positiveId(raw.role_id)&&
      raw.role_id!==teacherRoleId?'STUDENT':null;
    return {...raw,role_code:explicit??known??student};
  });
}
