import { error } from "./bff";

const strings=['name','description','level','currency','price','discount_price','duration_hours',
 'total_lessons','subcategory_id','course_type_id','init_date','finish_date'];
const booleans=['is_free','is_published','open_enrollment'];
const levels=['PRINCIPIANTE','INTERMEDIO','AVANZADO'];
const asText=(v:FormDataEntryValue|null)=>typeof v==='string'?v.trim():null;
const money=(v:string)=>/^\d+(?:\.\d{1,2})?$/.test(v)&&Number(v)<100000000;
const positive=(v:string)=>/^[1-9]\d*$/.test(v)&&Number.isSafeInteger(Number(v));
const natural=(v:string)=>/^\d+$/.test(v)&&Number.isSafeInteger(Number(v));
const date=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));
/** Valida también en servidor. Nunca se confía en selects ni campos ocultos del navegador. */
export function validateCourseForm(form:FormData,mode:'create'|'update'):
 {data:FormData;courseTypeId:number|null}|{response:ReturnType<typeof error>} {
 const allowed=new Set([...strings,...booleans,'image']);
 for(const k of form.keys())if(!allowed.has(k))return {response:error(400,`Campo no permitido: ${k}`)};
 const name=asText(form.get('name')),description=asText(form.get('description')),
 level=asText(form.get('level')),currency=asText(form.get('currency')),
 sub=asText(form.get('subcategory_id')),courseType=asText(form.get('course_type_id')),
 price=asText(form.get('price')),discount=asText(form.get('discount_price')),
 hours=asText(form.get('duration_hours')),lessons=asText(form.get('total_lessons'));
 if(!name||name.length>180||!description||description.length>10000||!level||!levels.includes(level)||
  !currency||!/^[A-Z]{3}$/.test(currency)||!sub||!positive(sub)||!price||!money(price)||
  !hours||!natural(hours)||!lessons||!natural(lessons))return {response:error(400,'Revisa nombre, descripción, moneda, nivel, precio, duración y subcategoría')};
 if(mode==='create'&&(!courseType||!positive(courseType)))return {response:error(400,'Selecciona un tipo de curso válido')};
 if(mode==='update'&&courseType)return {response:error(400,'Cambiar tipo exige previsualización y confirmación')};
 if(discount&&!money(discount))return {response:error(400,'Precio de descuento inválido')};
 if(form.get('is_free')!=='true'&&discount&&Number(discount)>Number(price))return {response:error(400,'El descuento no puede superar el precio')};
 const from=asText(form.get('init_date')),to=asText(form.get('finish_date'));
 if(from&&!date(from)||to&&!date(to)||from&&to&&to<from)return {response:error(400,'Fechas inválidas')};
 for(const b of booleans)if(form.has(b)&&!['true','false'].includes(asText(form.get(b))||''))return {response:error(400,`Valor inválido: ${b}`)};
 const image=form.get('image');if(image!==null){
  if(!(image instanceof File)||image.size>5*1024*1024||image.size===0||
    !['image/jpeg','image/png','image/webp'].includes(image.type))return {response:error(400,'Imagen inválida: JPG, PNG o WebP, máximo 5 MB')};
 }
 const cleaned=new FormData();
 for(const k of [...strings,...booleans]){
  if(k==='course_type_id'&&mode==='update')continue;
  if(k==='is_published'&&mode==='create'){cleaned.set(k,'false');continue;}
  const v=asText(form.get(k));if(v!==null&&v!=='')cleaned.set(k,v);
 }
 if(image instanceof File)cleaned.set('image',image);
 return {data:cleaned,courseTypeId:courseType?Number(courseType):null};
}
