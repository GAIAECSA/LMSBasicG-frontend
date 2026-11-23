/** Identificadores públicos del catálogo; el BFF usa lista blanca. */
export const REPORT_CODES = [
  'structure','degree','labor-certificate','id-card','payment',
  'attendance-students','attendance-teachers','diagnostic','practical',
  'theoretical','final-grades','survey-students','survey-teachers','mdt-certificates',
] as const;
export type ReportCode = typeof REPORT_CODES[number];
export type ReportGroup = {id:string;title:string;subtitle:string;reports:readonly ReportCode[]};
export const REPORT_GROUPS:readonly ReportGroup[] = [
  {id:'structure',title:'Estructura del curso',subtitle:'Organización de módulos, lecciones y recursos',reports:['structure']},
  {id:'documents',title:'Documentos MDT',subtitle:'Entregas de los cuatro documentos obligatorios',reports:['degree','labor-certificate','id-card','payment']},
  {id:'attendance',title:'Asistencias',subtitle:'Estudiantes y docentes aceptados',reports:['attendance-students','attendance-teachers']},
  {id:'grades',title:'Evaluaciones y notas',subtitle:'Selecciona las actividades que irán en cada PDF',reports:['diagnostic','practical','theoretical','final-grades']},
  {id:'surveys',title:'Encuestas de satisfacción',subtitle:'Respuestas de estudiantes y docentes por separado',reports:['survey-students','survey-teachers']},
  {id:'certificates',title:'Certificados MDT',subtitle:'Carga y última descarga del certificado ministerial',reports:['mdt-certificates']},
];
export const TITLES:Record<ReportCode,string> = {
  'structure':'Estructura del curso','degree':'Copia de título',
  'labor-certificate':'Copia de certificado laboral','id-card':'Copia de cédula',
  'payment':'Comprobante de pago','attendance-students':'Asistencia de estudiantes',
  'attendance-teachers':'Asistencia de docentes','diagnostic':'Evaluación diagnóstica',
  'practical':'Evaluación práctica final','theoretical':'Evaluación teórica final',
  'final-grades':'Notas finales','survey-students':'Encuestas de estudiantes',
  'survey-teachers':'Encuestas de docentes','mdt-certificates':'Certificados MDT',
};
export type ReportActivity={id:number;title:string;type:'quiz'|'homework';counts_toward_grade:boolean};
export type ReportCatalog={course_id:number;course_name:string;reports:{code:ReportCode;title:string;category:string}[];
  activities:ReportActivity[];defaults:Partial<Record<ReportCode,number[]>>};
export const GRADE_CODES = ['diagnostic','practical','theoretical','final-grades'] as const;
const isRecord=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function parseReportCatalog(raw:unknown,courseId:number):ReportCatalog|null {
  if(!isRecord(raw)||raw.course_id!==courseId||typeof raw.course_name!=='string'||
    !Array.isArray(raw.activities)||!isRecord(raw.defaults)||!Array.isArray(raw.reports))return null;
  const ids=new Set<number>();
  const activities:ReportActivity[]=[];
  for(const candidate of raw.activities){
    if(!isRecord(candidate)||!Number.isSafeInteger(candidate.id)||Number(candidate.id)<1||
      typeof candidate.title!=='string'||candidate.title.length>500||
      !['quiz','homework'].includes(String(candidate.type))||typeof candidate.counts_toward_grade!=='boolean'||ids.has(candidate.id as number))return null;
    ids.add(candidate.id as number);
    activities.push(candidate as ReportActivity);
  }
  const defaults:Partial<Record<ReportCode,number[]>>={};
  for(const code of GRADE_CODES){const list=raw.defaults[code];
    if(!Array.isArray(list)||!list.every(v=>Number.isSafeInteger(v)&&ids.has(v as number)))return null;
    defaults[code]=list as number[];
  }
  return {course_id:courseId,course_name:raw.course_name,activities,defaults,
    reports:raw.reports.filter(isRecord).filter(v=>REPORT_CODES.includes(v.code as ReportCode)&&
      typeof v.title==='string'&&typeof v.category==='string') as ReportCatalog['reports']};
}
export function reportUrl(courseId:number,code:ReportCode,ids?:number[]):string {
  const url=`/api/course-reports/${courseId}/${code}/pdf`;
  return ids?.length?url+'?'+new URLSearchParams(ids.map(id=>['activity_ids',String(id)])).toString():url;
}
