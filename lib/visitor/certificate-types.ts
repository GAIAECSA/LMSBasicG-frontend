/** Contratos y validación puros para los certificados privados del visitante. */
export type VisitorCertType='AUTOMATIC'|'MDT'|'INSTITUTIONAL';
export type VisitorCertItem={id:number;type:VisitorCertType;status:string;can_preview:boolean;can_download:boolean;can_generate:boolean;registered_at:string|null};
export type VisitorCertCourse={course_id:number;course_name:string;course_type:'MOOC'|'MDT';is_published:boolean;
 academic_eligible:boolean;certificate_note:string|null;certificates:VisitorCertItem[]};
export type VisitorCertList={courses:VisitorCertCourse[];total:number;page:number;page_size:number};
export type VisitorCertState={status:'ok';data:VisitorCertList}|{status:'unavailable'};

const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const pos=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
export function parseVisitorCertList(value:unknown):VisitorCertList|null{
 if(!record(value)||!Array.isArray(value.courses)||!Number.isSafeInteger(value.total)||Number(value.total)<0||
    !pos(value.page)||!pos(value.page_size)||Number(value.page_size)>50||value.courses.length>Number(value.page_size))return null;
 const seen=new Set<number>();
 for(const course of value.courses){
  if(!record(course)||!pos(course.course_id)||seen.has(course.course_id)||
     typeof course.course_name!=='string'||!['MOOC','MDT'].includes(String(course.course_type))||
     typeof course.is_published!=='boolean'||typeof course.academic_eligible!=='boolean'||
     !(course.certificate_note===null||typeof course.certificate_note==='string')||
     !Array.isArray(course.certificates)||!course.certificates.length||course.certificates.length>4)return null;
  seen.add(course.course_id);
  const ids=new Set<number>();
  for(const cert of course.certificates){
   if(!record(cert)||!pos(cert.id)||ids.has(cert.id)||!['AUTOMATIC','MDT','INSTITUTIONAL'].includes(String(cert.type))||
      typeof cert.status!=='string'||typeof cert.can_preview!=='boolean'||typeof cert.can_download!=='boolean'||
      typeof cert.can_generate!=='boolean'||!(cert.registered_at===null||typeof cert.registered_at==='string')||
      (course.course_type==='MOOC'&&cert.type!=='AUTOMATIC')||
      (course.course_type==='MDT'&&cert.type==='AUTOMATIC'))return null;
   ids.add(cert.id);
  }
 }
 return value as VisitorCertList;
}
