/** Contratos del aula STUDENT. La nota, elegibilidad y progreso son autoridad FastAPI.
 * La interfaz jamás fabrica calificaciones ni desbloquea certificados localmente. */
import {BLOCK_KINDS,type BlockKind} from '@/lib/course-modules/domain';

export type StudentSection='summary'|'content'|'grades'|'certificate';
export const STUDENT_SECTIONS:readonly StudentSection[]=['summary','content','grades','certificate'];
export type StudentGrade={status:string;score:string|null;attempts?:number|null;performed_at:string|null;assisted:boolean};
export type StudentBlock={id:number;kind:BlockKind;block_type:BlockKind;order:number;title:string;
  counts_toward_grade:boolean;date_available:string|null;available:boolean;completed:boolean;
  academically_complete:boolean;is_active:boolean;grade:StudentGrade|null;survey_id:number|null};
export type StudentLesson={id:number;name:string;order:number;blocks:StudentBlock[]};
export type StudentModule={id:number;name:string;order:number;lessons:StudentLesson[]};
export type StudentDocument={id:number;title:string;submitted:boolean;uploaded_at:string|null;
  date_available:string|null;available:boolean};
export type StudentOverview={course:{id:number;name:string;description:string;code:'MDT'|'MOOC';
  grade_calculation_method:'AVERAGE'|'WEIGHTED';duration_hours:number;level:string;image_url:string|null;
  init_date:string|null;finish_date:string|null};enrollment_id:number;
  modules:StudentModule[];documents:StudentDocument[];
  progress:{completed:number;total:number;percent:number|null};final_grade:string|null};
export type StudentActivityGrade={id:number;title:string;kind:'quiz'|'homework';counts_toward_grade:boolean;
  grade_weight:string|null;status:string;score:string|null;performed_at:string|null;attempts:number|null;assisted:boolean};
export type StudentGrades={course_id:number;method:'AVERAGE'|'WEIGHTED';activities:StudentActivityGrade[];final_grade:string|null};
export type StudentCertificate={id:number;type:'AUTOMATIC'|'MDT'|'INSTITUTIONAL';status:string};
export type StudentEligibility={course_id:number;code:'MOOC'|'MDT';eligible:boolean;academic_eligible:boolean;
  can_generate:boolean;can_download:boolean;pending_institutional_upload:boolean;
  certificate_setup:{reservation_exists:boolean;automatic_enabled:boolean;has_template:boolean;identity_ready:boolean;certificate_status:string|null}|null;
  final_grade:string|null;minimum_grade:string;grade_ok:boolean;
  missing_activities:{block_id:number;type:string;title:string}[];missing_documents:StudentDocument[];
  completed_activities:number;total_activities:number;documents_submitted:number;documents_total:number;
  attendance_required:boolean;certificates:StudentCertificate[]};

export const isRecord=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export const positive=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
export const isStudentSection=(v:string):v is StudentSection=>STUDENT_SECTIONS.includes(v as StudentSection);
export const studentApi=(id:number,...segments:(string|number)[])=>
  `/api/student-courses/${id}/${segments.map(s=>encodeURIComponent(String(s))).join('/')}`;
export function flattenBlocks(overview:StudentOverview):StudentBlock[]{
  return overview.modules.flatMap(m=>m.lessons.flatMap(l=>l.blocks));
}
export function findStudentBlock(overview:StudentOverview,id:number):StudentBlock|undefined{
  return flattenBlocks(overview).find(b=>b.id===id);
}
export function canEnterBlock(block:StudentBlock):boolean{return block.is_active&&block.available;}
export function studentBlockStatus(block:StudentBlock):'locked'|'complete'|'grading'|'pending'{
  if(!canEnterBlock(block))return 'locked';
  if(block.completed&&block.grade&&block.kind==='homework'&&block.grade.status!=='CALIFICADO')return 'grading';
  return block.completed?'complete':'pending';
}
export function parseStudentOverview(value:unknown,id:number):StudentOverview{
  if(!isRecord(value)||!isRecord(value.course)||value.course.id!==id||
     !['MOOC','MDT'].includes(String(value.course.code))||typeof value.course.name!=='string'||
     !Array.isArray(value.modules)||!Array.isArray(value.documents)||!isRecord(value.progress))
    throw Error('Estructura del aula no compatible con el backend STUDENT.');
  const moduleIds=new Set<number>(),lessonIds=new Set<number>(),blockIds=new Set<number>();
  for(const mod of value.modules){
    if(!isRecord(mod)||!positive(mod.id)||moduleIds.has(mod.id)||!Array.isArray(mod.lessons))throw Error('Módulo inválido');
    moduleIds.add(mod.id);
    for(const lesson of mod.lessons){
      if(!isRecord(lesson)||!positive(lesson.id)||lessonIds.has(lesson.id)||!Array.isArray(lesson.blocks))throw Error('Lección inválida');
      lessonIds.add(lesson.id);
      for(const block of lesson.blocks){
        if(!isRecord(block)||!positive(block.id)||blockIds.has(block.id)||!BLOCK_KINDS.includes(block.kind as BlockKind)||
           block.kind!==block.block_type||typeof block.title!=='string'||typeof block.available!=='boolean'||
           typeof block.completed!=='boolean'||typeof block.is_active!=='boolean')throw Error('Bloque inválido');
        blockIds.add(block.id);
      }
    }
  }
  for(const doc of value.documents){
    if(!isRecord(doc)||!positive(doc.id)||blockIds.has(doc.id)||typeof doc.submitted!=='boolean')throw Error('Documento inválido');
    blockIds.add(doc.id);
  }
  return value as StudentOverview;
}
export const scoreLabel=(value:string|null)=>value===null?'Sin calificar':`${Number(value).toFixed(2)} / 10`;
export const shortDate=(value:string|null)=>value?new Date(value).toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'}):'—';
export const isPdfFile=(file:File)=>/\.pdf$/i.test(file.name)&&(!file.type||file.type==='application/pdf')&&file.size>0&&file.size<=25*1024*1024;
