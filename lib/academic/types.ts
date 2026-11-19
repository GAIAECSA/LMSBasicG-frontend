import type { TenantModule } from "@/lib/auth/types";

export type CourseCode = "MOOC" | "MDT";
export type GradeMethod = "AVERAGE" | "WEIGHTED";
export type CourseLevel = "PRINCIPIANTE" | "INTERMEDIO" | "AVANZADO";
export type Category = { id:number; name:string };
export type Subcategory = { id:number; name:string; category_id:number };
export type CourseType = { id:number; code:CourseCode; name:string; description:string|null };
export type CertificateCapability = { id:number; is_active:boolean; certificate_type:{ id:number; code:string; name:string } };
export type ManagedCourse = {
 id:number; name:string; description:string; price:number; is_free:boolean;
 level:CourseLevel; is_published:boolean; open_enrollment:boolean;
 duration_hours:number; total_lessons:number; image_url:string|null;
 discount_price:number|null; currency:string; published_at:string|null;
 total_students:number; grade_calculation_method:GradeMethod;
 init_date:string|null; finish_date:string|null;
 subcategory_id:number; course_type_id:number; course_type:CourseType;
 certificate_types:CertificateCapability[];
};
export type TransitionItem = {id:number|null;code:string;name:string;has_existing_data:boolean};
export type CourseTransition = {
 course_id:number; current_type:CourseType; target_type:CourseType;
 blocks_to_create:TransitionItem[]; blocks_to_reactivate:TransitionItem[];
 blocks_to_deactivate:TransitionItem[]; blocks_to_preserve:TransitionItem[];
 certificate_types_to_create:TransitionItem[]; certificate_types_to_reactivate:TransitionItem[];
 certificate_types_to_deactivate:TransitionItem[]; manual_blocks_untouched:number;
 automatic_certificates_to_provision:number;existing_automatic_certificates_untouched:number;
 attendance_rows_to_provision:number;data_will_be_deleted:boolean;
};

const record = (v:unknown):v is Record<string,unknown> => !!v && typeof v==='object' && !Array.isArray(v);
const positive = (v:unknown):v is number => Number.isSafeInteger(v) && (v as number)>0;
const text = (v:unknown):v is string => typeof v==='string' && v.length>0;
const num = (v:unknown):number|null => {
 if(typeof v!=='string' && typeof v!=='number') return null;
 if(typeof v==='string' && !/^\d+(?:\.\d+)?$/.test(v))return null;
 const n=Number(v);return Number.isFinite(n)&&n>=0?n:null;
};
export const validId = (v:unknown):v is number => positive(v);
export const parseCategory = (v:unknown):Category|null => record(v)&&positive(v.id)&&text(v.name)?{id:v.id,name:v.name}:null;
export const parseSubcategory = (v:unknown):Subcategory|null => record(v)&&positive(v.id)&&positive(v.category_id)&&text(v.name)?{id:v.id,category_id:v.category_id,name:v.name}:null;
export const parseCourseType = (v:unknown):CourseType|null => record(v)&&positive(v.id)&&["MOOC","MDT"].includes(String(v.code))&&text(v.name)?
 {id:v.id,code:v.code as CourseCode,name:v.name,description:typeof v.description==='string'?v.description:null}:null;
export function parseList<T>(v:unknown,parse:(entry:unknown)=>T|null):T[]|null {
 if(!Array.isArray(v))return null;
 const out:T[]=[];for(const item of v){const parsed=parse(item);if(!parsed)return null;out.push(parsed);}return out;
}
export function parseCourse(v:unknown):ManagedCourse|null {
 if(!record(v)||!positive(v.id)||!text(v.name)||typeof v.description!=='string'||!positive(v.subcategory_id)||
 !positive(v.course_type_id)||!['PRINCIPIANTE','INTERMEDIO','AVANZADO'].includes(String(v.level))||
 typeof v.is_free!=='boolean'||typeof v.is_published!=='boolean'||typeof v.open_enrollment!=='boolean'||
 !Number.isSafeInteger(v.duration_hours)||(v.duration_hours as number)<0||!Number.isSafeInteger(v.total_lessons)||
 !Number.isSafeInteger(v.total_students)||!text(v.currency)||
 !['AVERAGE','WEIGHTED'].includes(String(v.grade_calculation_method)))return null;
 const type=parseCourseType(v.course_type),price=num(v.price),discount=v.discount_price==null?null:num(v.discount_price);
 if(!type||v.course_type_id!==type.id||price==null||(v.discount_price!=null&&discount==null))return null;
 const certificates=parseList(v.certificate_types,(x):CertificateCapability|null=>{
  if(!record(x)||!positive(x.id)||typeof x.is_active!=='boolean'||!record(x.certificate_type)||
  !positive(x.certificate_type.id)||!text(x.certificate_type.code)||!text(x.certificate_type.name))return null;
  return {id:x.id,is_active:x.is_active,certificate_type:{id:x.certificate_type.id,code:x.certificate_type.code,name:x.certificate_type.name}};
 });
 if(!certificates)return null;
 const date=(x:unknown)=>typeof x==='string'?x:null;
 return {id:v.id,name:v.name,description:v.description,price,is_free:v.is_free,level:v.level as CourseLevel,
 is_published:v.is_published,open_enrollment:v.open_enrollment,duration_hours:v.duration_hours as number,
 total_lessons:v.total_lessons as number,image_url:date(v.image_url),discount_price:discount,currency:v.currency,
 published_at:date(v.published_at),total_students:v.total_students as number,
 grade_calculation_method:v.grade_calculation_method as GradeMethod,init_date:date(v.init_date),
 finish_date:date(v.finish_date),subcategory_id:v.subcategory_id,course_type_id:v.course_type_id,
 course_type:type,certificate_types:certificates};
}
export function parseTransition(v:unknown):CourseTransition|null {
 if(!record(v)||!positive(v.course_id))return null;
 const current=parseCourseType(v.current_type),target=parseCourseType(v.target_type);
 if(!current||!target)return null;
 const keys=['blocks_to_create','blocks_to_reactivate','blocks_to_deactivate','blocks_to_preserve',
 'certificate_types_to_create','certificate_types_to_reactivate','certificate_types_to_deactivate'] as const;
 const lists:Record<string,TransitionItem[]>={};
 for(const key of keys){const values=parseList(v[key],(x):TransitionItem|null=>{
  if(!record(x)||!text(x.code)||!text(x.name)||typeof x.has_existing_data!=='boolean'||
   !(x.id===null||positive(x.id)))return null;
  return {id:x.id as number|null,code:x.code,name:x.name,has_existing_data:x.has_existing_data};
 });if(!values)return null;lists[key]=values;}
 const count=(key:string)=>Number.isSafeInteger(v[key]) && (v[key] as number)>=0?(v[key] as number):0;
 return {course_id:v.course_id,current_type:current,target_type:target,
 blocks_to_create:lists.blocks_to_create,blocks_to_reactivate:lists.blocks_to_reactivate,
 blocks_to_deactivate:lists.blocks_to_deactivate,blocks_to_preserve:lists.blocks_to_preserve,
 certificate_types_to_create:lists.certificate_types_to_create,certificate_types_to_reactivate:lists.certificate_types_to_reactivate,
 certificate_types_to_deactivate:lists.certificate_types_to_deactivate,manual_blocks_untouched:count('manual_blocks_untouched'),
 automatic_certificates_to_provision:count('automatic_certificates_to_provision'),
 existing_automatic_certificates_untouched:count('existing_automatic_certificates_untouched'),
 attendance_rows_to_provision:count('attendance_rows_to_provision'),data_will_be_deleted:v.data_will_be_deleted===true};
}
/** Mapeo EXPLÍCITO por código lms_configs (nunca por ID, nombre o coincidencia parcial).
 * Por defecto MOOC/MDT. Si los códigos reales son diferentes, configurarlos
 * en variables SOLO del servidor Next.js. Falta validación correspondiente en FastAPI. */
export function enabledCourseCodes(modules:TenantModule[],config:{MOOC:string;MDT:string}={MOOC:'MOOC',MDT:'MDT'}):CourseCode[] {
 return (["MOOC","MDT"] as CourseCode[]).filter(code=>{
  const capability=config[code];
  return /^[A-Z0-9_:-]{1,80}$/.test(capability)&&modules.some(m=>m.code===capability);
 });
}
