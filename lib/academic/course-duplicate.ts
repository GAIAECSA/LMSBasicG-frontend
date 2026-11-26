/** Contrato de CourseDuplicateRequest. Fechas de calendario, nunca timestamps. */
export type DuplicateCourseInput = {name:string;init_date:string|null;finish_date:string|null};
function calendarDate(value:unknown):value is string {
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value.startsWith('0000'))return false;
 const date=new Date(`${value}T00:00:00Z`);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function parseDuplicateInput(value:unknown):DuplicateCourseInput|null {
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['name','init_date','finish_date'].includes(k))||typeof v.name!=='string')return null;
 const name=v.name.trim();if(!name||[...name].length>255)return null;
 const start=v.init_date===undefined?null:v.init_date, end=v.finish_date===undefined?null:v.finish_date;
 if(start!==null&&!calendarDate(start)||end!==null&&!calendarDate(end))return null;
 if(start&&end&&end<start)return null;
 return {name,init_date:start,finish_date:end};
}
