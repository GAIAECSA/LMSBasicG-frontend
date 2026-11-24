import type { ManagedCourse, GradeMethod, CourseLevel } from '@/lib/academic/types';

export type CourseEditor = {
  name:string; description:string; categoryId:string; subcategoryId:string;
  level:CourseLevel; price:string; discount:string; currency:string;
  isFree:boolean; isPublished:boolean; openEnrollment:boolean;
  hours:string; lessons:string; initDate:string; finishDate:string;
  gradeMethod:GradeMethod; image:File|null;
};

export function courseEditorFrom(course:ManagedCourse):CourseEditor {
  return {
    name:course.name,description:course.description,categoryId:'',
    subcategoryId:String(course.subcategory_id),level:course.level,
    price:String(course.price),discount:course.discount_price===null?'':String(course.discount_price),
    currency:course.currency,isFree:course.is_free,isPublished:course.is_published,
    openEnrollment:course.open_enrollment,hours:String(course.duration_hours),
    lessons:String(course.total_lessons),initDate:course.init_date?.slice(0,10)??'',
    finishDate:course.finish_date?.slice(0,10)??'',gradeMethod:course.grade_calculation_method,image:null,
  };
}

/** Contrato real de CourseUpdate.as_form: los campos vacíos NO borran valores
 * opcionales. Fallar cerrado cuando una operación de limpieza no está soportada.
 */
export function validateEditor(course:ManagedCourse,value:CourseEditor):string|null {
  if(!value.name.trim()||value.name.trim().length>180||!value.description.trim()||value.description.trim().length>10000)
    return 'El nombre y la descripción son obligatorios.';
  if(!/^[1-9]\d*$/.test(value.subcategoryId))return 'Selecciona una subcategoría válida.';
  if(!/^[A-Z]{3}$/.test(value.currency))return 'La moneda debe tener tres letras mayúsculas.';
  if(!/^\d+$/.test(value.hours)||!Number.isSafeInteger(Number(value.hours))||
    !/^\d+$/.test(value.lessons)||!Number.isSafeInteger(Number(value.lessons)))
    return 'Duración y número de lecciones deben ser enteros no negativos.';
  if(!/^\d+(\.\d{1,2})?$/.test(value.price)||Number(value.price)>=100000000||
    (value.discount!==''&&!/^\d+(\.\d{1,2})?$/.test(value.discount)))
    return 'Revisa el formato de los precios (máximo dos decimales).';
  if(!value.isFree&&value.discount!==''&&Number(value.discount)>Number(value.price))
    return 'El descuento no puede superar el precio.';
  if(value.initDate&&value.finishDate&&value.finishDate<value.initDate)
    return 'La fecha final no puede preceder a la inicial.';
  if(course.discount_price!==null&&!value.isFree&&value.discount==='')
    return 'El backend aún no permite quitar un descuento de un curso de pago. Mantén el valor o hazlo gratuito.';
  if(course.init_date&&!value.initDate||course.finish_date&&!value.finishDate)
    return 'El backend aún no permite borrar fechas existentes. Consérvalas o actualízalas.';
  if(value.image && (value.image.size<1||value.image.size>5*1024*1024||
    !['image/jpeg','image/png','image/webp'].includes(value.image.type)))
    return 'La portada debe ser JPG, PNG o WebP y pesar como máximo 5 MB.';
  return null;
}

export function courseUpdateForm(value:CourseEditor):FormData {
  const form=new FormData();
  const fields={
    name:value.name.trim(),description:value.description.trim(),subcategory_id:value.subcategoryId,
    level:value.level,price:value.isFree?'0':value.price, currency:value.currency,
    duration_hours:value.hours,total_lessons:value.lessons,
    is_free:String(value.isFree),is_published:String(value.isPublished),
    open_enrollment:String(value.openEnrollment),
  };
  for(const [key,val] of Object.entries(fields))form.set(key,val);
  if(!value.isFree&&value.discount)form.set('discount_price',value.discount);
  if(value.initDate)form.set('init_date',value.initDate);
  if(value.finishDate)form.set('finish_date',value.finishDate);
  if(value.image)form.set('image',value.image);
  // course_type_id y grade_calculation_method NO son campos de CourseUpdate.
  return form;
}
