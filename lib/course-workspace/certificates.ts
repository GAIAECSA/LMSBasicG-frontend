/** Contratos de certificados. FastAPI es la fuente de verdad para autorización,
 * plantilla, nota, elegibilidad, emisión, eventos y documento privado.
 * No conservar cédulas ni URLs privadas en estado del navegador.
 */
export const CERT_PAGE_WIDTH=1122;
export const CERT_PAGE_HEIGHT=794;
export const MAX_CERT_BACKGROUND=10*1024*1024;
export const MAX_CERT_PDF=25*1024*1024;
export const CERT_IMPORT_BATCH=20;
export const CERT_KEYS=['student_name','student_idnumber','course_name','course_duration',
  'course_start_date','course_end_date','enrollment_date','final_grade','certificate_code',
  'instructor_name','title','custom_text'] as const;
export type CertFieldKey=typeof CERT_KEYS[number];
export type CertFont='Georgia'|'Times New Roman'|'Arial'|'DejaVu Sans'|'DejaVu Serif'|'DejaVu Sans Mono';
export type CertField={key:CertFieldKey;x:number;y:number;width:number;height:number;
  fontSize:number;fontFamily:CertFont;color:string;align:'left'|'center'|'right';bold:boolean;
  prefix?:string;suffix?:string;text?:string};
export type CertQr={x:number;y:number;size:number;enabled:true};
export type CertPreset={code:'classic'|'modern';name:string;width:1122;height:794;
  fields:CertField[];qr_config:CertQr};
export type CertTemplate={id:number;course_id:number;fields:CertField[];qr_config:CertQr;
  has_background:boolean;updated_at:string};
export type AutomaticCert={id:number;course_id:number;certificate_code:string;
  course_name:string|null;student_name:string|null;final_grade:string|null;
  status:'PENDIENTE'|'EMITIDO'|'REVOCADO';is_valid:boolean;created_at:string};
export type CertEvent={id:number;actor_user_id:number;action:string;
  previous_status:string|null;new_status:string;reason:string|null;created_at:string};
export type ExternalStudent={enrollment_id:number;student_name:string;username:string;email:string;
  has_identity:boolean;certificate_id:number|null;certificate_status:string};
export type ExternalRoster={course_id:number;certificate_type:'MDT'|'INSTITUTIONAL';
  page:number;page_size:number;total:number;students:ExternalStudent[]};
export type ImportResult={filename:string;status:string;id:number|null;message:string|null};
export type ImportSummary={course_id:number;certificate_type:'MDT'|'INSTITUTIONAL';
  processed:number;results:ImportResult[]};

const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>0;
const nonNeg=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
const within=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const str=(v:unknown):v is string=>typeof v==='string';
const nullableString=(v:unknown):v is string|null=>v===null||str(v);
const ISO=(v:unknown):v is string=>str(v)&&!Number.isNaN(Date.parse(v));
// Usar `return invalid()` en cada rama de rechazo: TypeScript debe saber que
// la ejecución termina antes de acceder a los campos de un valor `unknown`.
const invalid=():never=>{throw new Error('Respuesta de certificados inválida');};

export function normalizeField(v:unknown):CertField {
  if(!obj(v)||!CERT_KEYS.includes(v.key as CertFieldKey)||
    !within(v.x,0,CERT_PAGE_WIDTH)||!within(v.y,0,CERT_PAGE_HEIGHT)||
    !within(v.width??300,1,CERT_PAGE_WIDTH)||!within(v.height??60,1,CERT_PAGE_HEIGHT)||
    Number(v.x)+Number(v.width??300)>CERT_PAGE_WIDTH+0.1||
    Number(v.y)+Number(v.height??60)>CERT_PAGE_HEIGHT+0.1||
    !within(v.fontSize??22,6,110)||
    !['Georgia','Times New Roman','Arial','DejaVu Sans','DejaVu Serif','DejaVu Sans Mono'].includes(String(v.fontFamily??'Arial'))||
    !['left','center','right'].includes(String(v.align??'left'))||
    !/^#[0-9A-Fa-f]{6}$/.test(String(v.color??'#15213A'))||
    ['prefix','suffix','text'].some(k=>v[k]!==undefined&&(!str(v[k])||(v[k] as string).length>300)))return invalid();
  return {key:v.key as CertFieldKey,x:v.x as number,y:v.y as number,
    width:(v.width??300) as number,height:(v.height??60) as number,
    fontSize:(v.fontSize??22) as number,fontFamily:(v.fontFamily??'Arial') as CertFont,
    color:(v.color??'#15213A') as string,align:(v.align??'left') as CertField['align'],
    bold:v.bold===true,prefix:str(v.prefix)?v.prefix:undefined,suffix:str(v.suffix)?v.suffix:undefined,
    text:str(v.text)?v.text:undefined};
}
export function normalizeQr(v:unknown):CertQr{
  if(!obj(v)||v.enabled!==true||!within(v.x,0,CERT_PAGE_WIDTH)||
     !within(v.y,0,CERT_PAGE_HEIGHT)||!within(v.size,40,280)||
     (v.x as number)+(v.size as number)>CERT_PAGE_WIDTH||
     (v.y as number)+(v.size as number)>CERT_PAGE_HEIGHT)return invalid();
  return {x:v.x as number,y:v.y as number,size:v.size as number,enabled:true};
}
export function validateLayout(fields:unknown,qr:unknown):{fields:CertField[];qr:CertQr}{
  if(!Array.isArray(fields)||fields.length>100)return invalid();
  return {fields:fields.map(normalizeField),qr:normalizeQr(qr)};
}
export function parsePresets(v:unknown):CertPreset[]{
  if(!Array.isArray(v))return invalid();
  const presets=v.map((entry:unknown):CertPreset=>{
    if(!obj(entry)||!['classic','modern'].includes(String(entry.code))||!str(entry.name)||
      entry.width!==1122||entry.height!==794)return invalid();
    const layout=validateLayout(entry.fields,entry.qr_config);
    return {code:entry.code as CertPreset['code'],name:entry.name,width:1122,height:794,
      fields:layout.fields,qr_config:layout.qr};
  });
  if(!presets.length||new Set(presets.map(p=>p.code)).size!==presets.length)return invalid();
  return presets;
}
export function parseTemplate(v:unknown,courseId:number):CertTemplate{
  if(!obj(v)||!id(v.id)||v.course_id!==courseId||!ISO(v.updated_at)||typeof v.has_background!=='boolean')return invalid();
  const layout=validateLayout(v.fields??[],v.qr_config??{x:880,y:620,size:116,enabled:true});
  return {id:v.id as number,course_id:courseId,fields:layout.fields,qr_config:layout.qr,
    has_background:v.has_background as boolean,updated_at:v.updated_at as string};
}
export function parseAutomaticCerts(v:unknown,courseId:number):AutomaticCert[]{
  if(!Array.isArray(v)||v.length>200)return invalid();
  return v.map((entry:unknown):AutomaticCert=>{
    if(!obj(entry)||!id(entry.id)||entry.course_id!==courseId||!str(entry.certificate_code)||
      !nullableString(entry.course_name)||!nullableString(entry.student_name)||
      !(entry.final_grade===null||typeof entry.final_grade==='number'||str(entry.final_grade))||
      !['PENDIENTE','EMITIDO','REVOCADO'].includes(String(entry.status))||
      typeof entry.is_valid!=='boolean'||!ISO(entry.created_at))return invalid();
    return {id:entry.id as number,course_id:courseId,certificate_code:entry.certificate_code as string,
      course_name:entry.course_name as string|null,student_name:entry.student_name as string|null,
      final_grade:entry.final_grade==null?null:String(entry.final_grade),
      status:entry.status as AutomaticCert['status'],is_valid:entry.is_valid as boolean,
      created_at:entry.created_at as string};
  });
}
export function parseEvents(v:unknown):CertEvent[]{
  if(!Array.isArray(v)||v.length>10000)return invalid();
  return v.map((entry:unknown):CertEvent=>{
    if(!obj(entry)||!id(entry.id)||!id(entry.actor_user_id)||!str(entry.action)||
       !nullableString(entry.previous_status)||!str(entry.new_status)||!nullableString(entry.reason)||
       !ISO(entry.created_at))return invalid();
    return {id:entry.id as number,actor_user_id:entry.actor_user_id as number,action:entry.action as string,
      previous_status:entry.previous_status as string|null,new_status:entry.new_status as string,
      reason:entry.reason as string|null,created_at:entry.created_at as string};
  });
}
export function parseRoster(v:unknown,courseId:number,code:'MDT'|'INSTITUTIONAL'):ExternalRoster{
  if(!obj(v)||v.course_id!==courseId||v.certificate_type!==code||!id(v.page)||
    !id(v.page_size)||!nonNeg(v.total)||!Array.isArray(v.students)||v.students.length>100)return invalid();
  const students=(v.students as unknown[]).map((entry:unknown):ExternalStudent=>{
    if(!obj(entry)||!id(entry.enrollment_id)||!str(entry.student_name)||!str(entry.username)||
      !str(entry.email)||typeof entry.has_identity!=='boolean'||
      !(entry.certificate_id===null||id(entry.certificate_id))||!str(entry.certificate_status))return invalid();
    return {enrollment_id:entry.enrollment_id as number,student_name:entry.student_name as string,
      username:entry.username as string,email:entry.email as string,
      has_identity:entry.has_identity as boolean,certificate_id:entry.certificate_id as number|null,
      certificate_status:entry.certificate_status as string};
  });
  return {course_id:courseId,certificate_type:code,page:v.page as number,page_size:v.page_size as number,
    total:v.total as number,students};
}
export function parseImportSummary(v:unknown,courseId:number,code:'MDT'|'INSTITUTIONAL'):ImportSummary{
  if(!obj(v)||v.course_id!==courseId||v.certificate_type!==code||!nonNeg(v.processed)||!Array.isArray(v.results))return invalid();
  const results=(v.results as unknown[]).map((entry:unknown):ImportResult=>{
    if(!obj(entry)||!str(entry.filename)||!str(entry.status)||
      !(entry.id===null||entry.id===undefined||id(entry.id))||
      !(entry.message===null||entry.message===undefined||str(entry.message)))return invalid();
    return {filename:entry.filename as string,status:entry.status as string,
      id:(entry.id as number|undefined)??null,message:(entry.message as string|undefined)??null};
  });
  if(results.length!==v.processed)return invalid();
  return {course_id:courseId,certificate_type:code,processed:v.processed as number,results};
}
export const certificateApi=(courseId:number,path:string)=>`/api/courses/${courseId}/certificates/${path}`;
export function validPdf(file:File):string|null{
  if(!file.name.toLowerCase().endsWith('.pdf')||file.type && file.type!=='application/pdf')return 'Selecciona un PDF válido.';
  if(file.size<=0||file.size>MAX_CERT_PDF)return 'El PDF debe tener entre 1 byte y 25 MiB.';
  return null;
}
export function validBackground(file:File):string|null{
  if(!/\.(png|jpe?g|webp)$/i.test(file.name)||
    !['image/png','image/jpeg','image/webp'].includes(file.type))return 'Selecciona una imagen PNG, JPG o WEBP.';
  if(file.size<=0||file.size>MAX_CERT_BACKGROUND)return 'La imagen no debe superar 10 MiB.';
  return null;
}
export const displayDate=(value:string)=>new Date(value).toLocaleDateString('es-EC',{day:'2-digit',month:'short',year:'numeric'});
export function readableError(error:unknown):string{
  return error instanceof Error?error.message:'No fue posible completar la solicitud';
}
export async function certificateRequest(path:string,init?:RequestInit):Promise<unknown>{
  const response=await fetch(path,{...init,cache:'no-store'});
  if(!response.ok){
    let message=`Solicitud rechazada (${response.status})`;
    try{const value:unknown=await response.json();if(obj(value)&&str(value.message))message=value.message;}catch{}
    const error=new Error(message) as Error&{status?:number};error.status=response.status;throw error;
  }
  return response.json();
}
export const isNotFound=(error:unknown)=>error instanceof Error&&(error as Error&{status?:number}).status===404;
