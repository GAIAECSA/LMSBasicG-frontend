/** Contratos puros del backend Fase 12. Nunca decide permisos ni la identidad de un usuario:
 * FastAPI resuelve la cédula contra idnumber_hash del tenant y aplica la transacción.
 */
import type { CourseRole, ImportPerson } from './bulk-enrollment';
import type { WeeklySlots } from './attendance-schedule';

export type RecurringInput = {
  course_id: number;
  from_date: string;
  to_date: string;
  weekly: { weekday: number; start_time: string; end_time: string }[];
  excluded_dates: string[];
  skip_existing: boolean;
};
export type RecurringSession = { course_id:number; day:string; start_time:string; end_time:string };
export type RecurringPreview = {
  total_generated:number; to_create:RecurringSession[]; existing:RecurringSession[]; excluded:string[];
};
export type RecurringCreation = {
  created: {id:number;course_id:number;day:string;start_time:string;end_time:string}[];
  skipped_existing:number; total_generated:number;
};
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isDate = (value:string):boolean => {
  if(!isoDate.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const valueDate = new Date(Date.UTC(y,m-1,d,12));
  return valueDate.getUTCFullYear()===y&&valueDate.getUTCMonth()===m-1&&valueDate.getUTCDate()===d;
};
/** JS getDay(): 0 domingo; Python weekday(): 0 lunes. */
export const jsDayToPython = (day:number):number => (day+6)%7;
export function recurringPayload(courseId:number,from:string,to:string,slots:WeeklySlots,exclusions:string):RecurringInput{
  if(!Number.isSafeInteger(courseId)||courseId<=0)throw Error('Curso inválido.');
  if(!isDate(from)||!isDate(to)||from>to)throw Error('El período de fechas es inválido.');
  const span=(Date.parse(`${to}T12:00:00Z`)-Date.parse(`${from}T12:00:00Z`))/86400000+1;
  if(span>366)throw Error('Máximo 366 días por programación.');
  const weekly=Object.entries(slots).filter(([,v])=>v.enabled).map(([day,v])=>({
    weekday:jsDayToPython(Number(day)),start_time:v.start,end_time:v.end,
  })).sort((a,b)=>a.weekday-b.weekday);
  if(!weekly.length)throw Error('Activa al menos un día de clases.');
  const hour=/^([01]\d|2[0-3]):[0-5]\d$/;
  if(weekly.some(row=>!hour.test(row.start_time)||!hour.test(row.end_time)||row.end_time<=row.start_time))
    throw Error('Corrige los horarios de inicio y fin.');
  const excluded_dates=[...new Set(exclusions.split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean))].sort();
  if(excluded_dates.some(d=>!isDate(d)||d<from||d>to))throw Error('Las exclusiones deben ser fechas válidas dentro del período.');
  return {course_id:courseId,from_date:from,to_date:to,weekly,excluded_dates,skip_existing:true};
}
export type BatchOutcome={row:number;user_id?:number;username?:string;role_code?:CourseRole;reason?:string;user_created?:boolean};
export type BatchResult={
  created:BatchOutcome[]; reactivated:BatchOutcome[]; skipped:BatchOutcome[]; failed:BatchOutcome[];
  summary:{total:number;created:number;reactivated:number;skipped:number;failed:number};
};
const roles=new Set(['STUDENT','TEACHER']);
export function existingBatchPayload(courseId:number,chosen:readonly {id:number;role_code:CourseRole}[]){
  if(chosen.length<1||chosen.length>300)throw Error('Selecciona entre 1 y 300 usuarios.');
  const ids=new Set<number>();
  for(const value of chosen){
    if(!Number.isSafeInteger(value.id)||value.id<=0||!roles.has(value.role_code)||ids.has(value.id))
      throw Error('Hay un usuario duplicado, un ID inválido o un rol incorrecto.');
    ids.add(value.id);
  }
  return {course_id:courseId,enrollments:chosen.map(value=>({course_id:courseId,user_id:value.id,role_code:value.role_code}))};
}
/** No comprobar username/email/nombre en el frontend para una cédula existente:
 * esas columnas DEBEN ignorarse según la fase 12. Solo el backend conoce las cédulas del tenant.
 */
export function massiveBatchPayload(courseId:number,rows:readonly ImportPerson[]){
  if(rows.length<1||rows.length>300)throw Error('El lote debe contener entre 1 y 300 personas.');
  const cedulas=new Set<string>();
  const users=rows.map((row,index)=>{
    const idnumber=row.idnumber.trim().toUpperCase();
    if(!idnumber)throw Error(`Fila ${index+1}: escribe la cédula para la búsqueda prioritaria.`);
    if(idnumber.length>100)throw Error(`Fila ${index+1}: la cédula es demasiado larga.`);
    if(cedulas.has(idnumber))throw Error(`Fila ${index+1}: la cédula está duplicada en el archivo.`);
    if(!roles.has(row.role_code))throw Error(`Fila ${index+1}: selecciona Estudiante o Profesor.`);
    cedulas.add(idnumber);
    return {
      idnumber,role_code:row.role_code,
      // Si existe la cédula, FastAPI descarta estos valores sin validar ni actualizar el perfil.
      username:row.username.trim()||null,password:row.password||null,
      firstname:row.firstname.trim()||null,lastname:row.lastname.trim()||null,
      email:row.email.trim()||null,phone_number:row.phone_number.trim()||null,
      province:row.province.trim()||null,
    };
  });
  return {course_id:courseId,users};
}
function obj(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
export function readBatchResult(data:unknown):BatchResult{
  if(!obj(data)||!obj(data.summary))throw Error('FastAPI devolvió un resumen de lote inválido. Verifica las matrículas antes de reintentar.');
  const names=['created','reactivated','skipped','failed'] as const;
  for(const name of names)if(!Array.isArray(data[name]))throw Error('Faltan resultados del lote. Verifica antes de reintentar.');
  const summary=data.summary;
  if(!['total',...names].every(k=>Number.isSafeInteger(summary[k])&&(summary[k] as number)>=0))
    throw Error('El resumen de matrículas es inválido.');
  return data as unknown as BatchResult;
}
export function readRecurringPreview(data:unknown):RecurringPreview{
  if(!obj(data)||!Number.isSafeInteger(data.total_generated)||!Array.isArray(data.to_create)||!Array.isArray(data.existing)||!Array.isArray(data.excluded))
    throw Error('La vista previa de FastAPI es inválida.');
  return data as RecurringPreview;
}
export function readRecurringCreation(data:unknown):RecurringCreation{
  if(!obj(data)||!Array.isArray(data.created)||!Number.isSafeInteger(data.skipped_existing)||!Number.isSafeInteger(data.total_generated))
    throw Error('No se pudo verificar el resultado de la programación. Recarga las sesiones.');
  return data as RecurringCreation;
}
