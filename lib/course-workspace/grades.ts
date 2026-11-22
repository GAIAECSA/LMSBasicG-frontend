/**
 * Contrato de lectura de la matriz de calificaciones de FastAPI.
 *
 * Solo se admiten bloques de quiz/homework vinculados a una lección. Los
 * bloques raíz (lesson_id=null), incluidos los documentos MDT, nunca deben
 * llegar a la vista de calificaciones: se valida de nuevo aquí sin reemplazar
 * la regla autoritativa del backend.
 *
 * Los Decimal de Pydantic v2 se conservan como cadenas; el navegador NO
 * calcula promedios, pesos ni certificados.
 */
export type GradeMethod='AVERAGE'|'WEIGHTED';
export type GradeActivityKind='quiz'|'homework';
export type GradeActivityFilter='ALL'|'COUNTED'|'NOT_COUNTED';
export type GradeActivityType='ALL'|GradeActivityKind;
export type GradeCellStatus='CALIFICADO'|'SIN_CALIFICAR'|'PENDIENTE'|'ENTREGADO'|'SIN_INTENTAR';
export type GradeDecimal=string;

export type GradeActivity={
  lesson_block_id:number;
  title:string;
  kind:GradeActivityKind;
  counts_toward_grade:boolean;
  grade_weight:GradeDecimal;
  module_id:number|null;
  module_name:string|null;
  lesson_id:number;
  lesson_name:string|null;
};
export type GradeCell={lesson_block_id:number;score:GradeDecimal|null;status:GradeCellStatus};
export type GradeStudent={
  enrollment_id:number;user_id:number;
  firstname:string;lastname:string;username:string;email:string|null;
  final_grade:GradeDecimal|null;
  grades:GradeCell[];
};
export type CourseGradesMatrix={
  course_id:number;course_name:string;
  grade_calculation_method:GradeMethod;grade_scale_max:10;
  page:number;page_size:number;total_students:number;
  activity_page:number;activity_page_size:number;
  total_activities:number;total_course_activities:number;total_counted_activities:number;
  activities:GradeActivity[];students:GradeStudent[];
};
export type GradeQuery={
  page:number;page_size:number;search:string;
  activity_filter:GradeActivityFilter;activity_type:GradeActivityType;
  activity_page:number;activity_page_size:number;
};
export const defaultGradeQuery:GradeQuery={
  page:1,page_size:25,search:'',activity_filter:'ALL',activity_type:'ALL',
  activity_page:1,activity_page_size:15,
};

const object=(v:unknown):v is Record<string,unknown>=>
  v!==null&&typeof v==='object'&&!Array.isArray(v);
const positive=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
const count=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const text=(v:unknown,max=500):v is string=>typeof v==='string'&&v.length<=max;
const optionalText=(v:unknown):v is string|null=>v===null||text(v);
const optionalId=(v:unknown):v is number|null=>v===null||positive(v);
/** Mantener el Decimal exacto del servidor, incluso si JSON manda number. */
function decimal(v:unknown,max:number|null=null,nonZero=false):GradeDecimal|null{
  if(v===null)return null;
  if(typeof v!=='string'&&typeof v!=='number')return null;
  const raw=String(v);
  if(!/^\d+(?:\.\d{1,20})?$/.test(raw))return null;
  const value=Number(raw);
  if(!Number.isFinite(value)||(nonZero&&value<=0)||(max!==null&&value>max))return null;
  return raw;
}
function invalid():never{throw Error('FastAPI devolvió una matriz de calificaciones inválida.');}
export function readCourseGradesMatrix(value:unknown,courseId:number):CourseGradesMatrix{
  if(!object(value)||!positive(courseId)||value.course_id!==courseId||
    !text(value.course_name,300)||!value.course_name.trim()||
    !['AVERAGE','WEIGHTED'].includes(String(value.grade_calculation_method))||
    value.grade_scale_max!==10||!positive(value.page)||!positive(value.page_size)||
    value.page_size>100||!count(value.total_students)||
    !positive(value.activity_page)||!positive(value.activity_page_size)||
    value.activity_page_size>100||!count(value.total_activities)||
    !count(value.total_course_activities)||!count(value.total_counted_activities)||
    value.total_counted_activities>value.total_course_activities||
    value.total_activities>value.total_course_activities||
    !Array.isArray(value.activities)||value.activities.length>value.activity_page_size||
    !Array.isArray(value.students)||value.students.length>value.page_size)return invalid();

  const activities:GradeActivity[]=value.activities.map((v:unknown)=>{
    if(!object(v)||!positive(v.lesson_block_id)||!text(v.title,500)||
      !['quiz','homework'].includes(String(v.kind))||typeof v.counts_toward_grade!=='boolean'||
      decimal(v.grade_weight,null,true)===null||!optionalId(v.module_id)||
      !optionalText(v.module_name)||!positive(v.lesson_id)||!optionalText(v.lesson_name))return invalid();
    return {
      lesson_block_id:v.lesson_block_id as number,title:v.title as string,
      kind:v.kind as GradeActivityKind,counts_toward_grade:v.counts_toward_grade as boolean,
      grade_weight:decimal(v.grade_weight,null,true)!,module_id:v.module_id as number|null,
      module_name:v.module_name as string|null,lesson_id:v.lesson_id as number,
      lesson_name:v.lesson_name as string|null,
    };
  });
  const activityIds=new Set(activities.map(a=>a.lesson_block_id));
  if(activityIds.size!==activities.length)return invalid();

  const students:GradeStudent[]=value.students.map((v:unknown)=>{
    if(!object(v)||!positive(v.enrollment_id)||!positive(v.user_id)||
      !text(v.firstname,150)||!text(v.lastname,150)||!text(v.username,150)||
      !optionalText(v.email)||!Array.isArray(v.grades)||
      v.grades.length!==activities.length||
      (v.final_grade!==null&&decimal(v.final_grade,10)===null))return invalid();
    const grades:GradeCell[]=v.grades.map((g:unknown)=>{
      if(!object(g)||!positive(g.lesson_block_id)||!activityIds.has(g.lesson_block_id as number)||
        !['CALIFICADO','SIN_CALIFICAR','PENDIENTE','ENTREGADO','SIN_INTENTAR'].includes(String(g.status)))return invalid();
      const isGraded=g.status==='CALIFICADO';
      if((isGraded&&decimal(g.score,10)===null)||(!isGraded&&g.score!==null))return invalid();
      const kind=activities.find(a=>a.lesson_block_id===g.lesson_block_id)?.kind;
      if((kind==='quiz'&&!['CALIFICADO','SIN_CALIFICAR','SIN_INTENTAR'].includes(String(g.status)))||
         (kind==='homework'&&!['CALIFICADO','ENTREGADO','PENDIENTE'].includes(String(g.status))))return invalid();
      return {lesson_block_id:g.lesson_block_id as number,
        score:isGraded?decimal(g.score,10):null,status:g.status as GradeCellStatus};
    });
    if(new Set(grades.map(g=>g.lesson_block_id)).size!==activityIds.size)return invalid();
    return {enrollment_id:v.enrollment_id as number,user_id:v.user_id as number,
      firstname:v.firstname as string,lastname:v.lastname as string,
      username:v.username as string,email:v.email as string|null,
      final_grade:decimal(v.final_grade,10),grades};
  });
  if(new Set(students.map(s=>s.enrollment_id)).size!==students.length||
     new Set(students.map(s=>s.user_id)).size!==students.length)return invalid();
  return {
    course_id:courseId,course_name:value.course_name as string,
    grade_calculation_method:value.grade_calculation_method as GradeMethod,grade_scale_max:10,
    page:value.page as number,page_size:value.page_size as number,
    total_students:value.total_students as number,
    activity_page:value.activity_page as number,activity_page_size:value.activity_page_size as number,
    total_activities:value.total_activities as number,
    total_course_activities:value.total_course_activities as number,
    total_counted_activities:value.total_counted_activities as number,
    activities,students,
  };
}

export function courseGradesUrl(courseId:number,query:GradeQuery):string{
  const params=new URLSearchParams({
    page:String(query.page),page_size:String(query.page_size),
    activity_filter:query.activity_filter,activity_type:query.activity_type,
    activity_page:String(query.activity_page),activity_page_size:String(query.activity_page_size),
  });
  if(query.search.trim())params.set('search',query.search.trim());
  return `/api/courses/${courseId}/grades?${params}`;
}
/** Presentación solamente: el backend ya redondeó a 2 decimales. */
export function displayGrade(value:GradeDecimal|null):string{
  if(value===null)return '—';
  const number=Number(value);
  return Number.isFinite(number)?number.toFixed(2):'—';
}
export function displayWeight(value:GradeDecimal):string{
  const number=Number(value);
  return Number.isFinite(number)?number.toLocaleString('es-EC',{maximumFractionDigits:4}):value;
}
export function gradeCellLabel(cell:GradeCell):string{
  if(cell.status==='CALIFICADO')return displayGrade(cell.score);
  return ({SIN_CALIFICAR:'Sin calificar',SIN_INTENTAR:'Sin intentar',
    ENTREGADO:'Entregado',PENDIENTE:'Pendiente'} as const)[cell.status];
}
