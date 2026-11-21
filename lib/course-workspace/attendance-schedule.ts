/** Reglas puras para la vista previa de sesiones (hora local del tenant, sin TZ UTC implícita).
 * El backend sigue siendo la autoridad. La generación frontend es secuencial y no atómica.
 */
export type Slot = { enabled: boolean; start: string; end: string };
export type WeeklySlots = Record<number, Slot>;
export type SessionDraft = { day: string; start_time: string; end_time: string };
export type ScheduleInput = {
  from: string; to: string; slots: WeeklySlots; exclusions: string;
};
const iso = /^\d{4}-\d{2}-\d{2}$/;
const hour = /^([01]\d|2[0-3]):[0-5]\d$/;
const safeDay = (s: string): Date | null => {
  if (!iso.test(s)) return null;
  const [y,m,d]=s.split('-').map(Number);
  const date=new Date(Date.UTC(y,m-1,d,12));
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
};
const dayKey=(date:Date):string=>date.toISOString().slice(0,10);
export const normalizeTime=(v:string):string=>v.slice(0,5);
export const sessionKey=(s:SessionDraft)=>`${s.day}|${normalizeTime(s.start_time)}|${normalizeTime(s.end_time)}`;
export function schedulePreview(input:ScheduleInput, existing:SessionDraft[], limit=120):{
  rows:SessionDraft[]; duplicates:number; error:string|null;
} {
  const start=safeDay(input.from);const end=safeDay(input.to);
  if(!start||!end||start.getTime()>end.getTime())return {rows:[],duplicates:0,error:'El período de fechas es inválido.'};
  const span=Math.round((end.getTime()-start.getTime())/86400000)+1;
  if(span>366)return {rows:[],duplicates:0,error:'Selecciona un período de hasta 366 días.'};
  const excluded=new Set(input.exclusions.split(/[\s,;]+/).map(v=>v.trim()).filter(Boolean));
  if([...excluded].some(v=>!safeDay(v)))return {rows:[],duplicates:0,error:'Una fecha de exclusión no tiene el formato AAAA-MM-DD.'};
  const active=Object.entries(input.slots).filter(([,v])=>v.enabled);
  if(!active.length)return {rows:[],duplicates:0,error:'Selecciona al menos un día de clase.'};
  for(const [,slot] of active){if(!hour.test(slot.start)||!hour.test(slot.end)||slot.end<=slot.start)
    return {rows:[],duplicates:0,error:'Cada horario debe terminar después de iniciar, dentro del mismo día.'};}
  const seen=new Set(existing.map(sessionKey));const generated=new Set<string>();
  const rows:SessionDraft[]=[];let duplicates=0;
  for(let i=0;i<span;i++){
    const date=new Date(start.getTime()+i*86400000);const day=dayKey(date);
    if(excluded.has(day))continue;
    const slot=input.slots[date.getUTCDay()];if(!slot?.enabled)continue;
    const row={day,start_time:slot.start,end_time:slot.end};const key=sessionKey(row);
    if(seen.has(key)||generated.has(key)){duplicates++;continue;}
    rows.push(row);generated.add(key);
    if(rows.length>limit)return {rows:[],duplicates:0,error:`Demasiadas sesiones. Máximo ${limit} por ejecución.`};
  }
  if(!rows.length)return {rows:[],duplicates,error:'No hay sesiones nuevas para crear con este período y excepciones.'};
  return {rows,duplicates,error:null};
}
