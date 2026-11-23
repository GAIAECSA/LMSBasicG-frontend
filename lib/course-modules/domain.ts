/** Contratos Modules v2. FastAPI conserva la autoridad académica. */
export const BLOCK_KINDS=['text','image','pdf','video','quiz','homework','survey','forum'] as const;
export type BlockKind=typeof BLOCK_KINDS[number];
export const BLOCK_NAMES:Record<BlockKind,string>={text:'Texto',image:'Imagen',pdf:'PDF',video:'Video',quiz:'Quiz / Prueba',homework:'Tarea',survey:'Encuesta',forum:'Foro'};
export const GRADED_KINDS:ReadonlySet<BlockKind>=new Set(['quiz','homework']);
export type ModuleBlock={id:number;order:number;block_type:BlockKind;title:string;counts_toward_grade:boolean;date_available:string|null;is_active:boolean};
export type ModuleLesson={id:number;name:string;order:number;blocks:ModuleBlock[]};
export type CourseModule={id:number;name:string;order:number;lessons:ModuleLesson[]};
export type CourseStructure={course_id:number;modules:CourseModule[]};
export type BlockDetail={id:number;lesson_id:number|null;block_type_id:number;content:Record<string,unknown>;
  counts_toward_grade:boolean;grade_weight:string|number;order:number;date_available:string|null;is_active:boolean;
  is_locked:boolean;lesson_block_type:{id:number;key:string;code:string}};
export type BlockTypeOption={id:number;code:string;key?:string;name:string;is_active:boolean};
export type GradePlanItem={lesson_block_id:number;counts_toward_grade:boolean;grade_weight:number};
export type GradePlanDraft={method:'AVERAGE'|'WEIGHTED';items:GradePlanItem[]};
export type GradePlan={course_id:number;method:'AVERAGE'|'WEIGHTED';active_items:GradePlanItem[];draft:GradePlanDraft|null};
export type QuizQuestion={id:number;question:string;question_type:'SINGLE'|'MULTIPLE'|'TRUE_FALSE';options:unknown[]|null;correct_answer:unknown;value:string|number;order:number};
export type SurveyQuestion={id:number;question:string;question_type:'scale'|'text';options:unknown[]|null;order:number;required:boolean};
export type SurveyDetail={id:number;lesson_block_id:number;title:string;description:string|null;audience:'BOTH'|'STUDENT'|'TEACHER';questions:SurveyQuestion[]};
export type Participant={enrollment_id:number;user_id:number;firstname:string;lastname:string;username:string;role:'STUDENT'|'TEACHER'};
export const pos=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
export const obj=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
export function parseStructure(value:unknown,id:number):CourseStructure {
  if(!obj(value)||value.course_id!==id||!Array.isArray(value.modules))throw Error('Estructura inválida recibida de FastAPI');
  const modules:CourseModule[]=value.modules.map(row=>{
    if(!obj(row)||!pos(row.id)||typeof row.name!=='string'||!Array.isArray(row.lessons))throw Error('Módulo inválido');
    const lessons:ModuleLesson[]=row.lessons.map(lesson=>{
      if(!obj(lesson)||!pos(lesson.id)||typeof lesson.name!=='string'||!Array.isArray(lesson.blocks))throw Error('Lección inválida');
      const blocks:ModuleBlock[]=lesson.blocks.map(block=>{
        if(!obj(block)||!pos(block.id)||!BLOCK_KINDS.includes(block.block_type as BlockKind)||typeof block.title!=='string')throw Error('Actividad inválida');
        return {id:block.id as number,title:block.title as string,block_type:block.block_type as BlockKind,
          order:Number(block.order)||0,counts_toward_grade:block.counts_toward_grade===true,
          date_available:typeof block.date_available==='string'?block.date_available:null,is_active:block.is_active===true};
      });
      return {id:lesson.id as number,name:lesson.name as string,order:Number(lesson.order)||0,blocks};
    });
    return {id:row.id as number,name:row.name as string,order:Number(row.order)||0,lessons};
  });
  const ids=(items:number[])=>new Set(items).size===items.length;
  if(!ids(modules.map(m=>m.id))||!ids(modules.flatMap(m=>m.lessons.map(l=>l.id)))||
     !ids(modules.flatMap(m=>m.lessons.flatMap(l=>l.blocks.map(b=>b.id)))))throw Error('IDs duplicados en Modules');
  return {course_id:id,modules};
}
export function snapshotOrder(tree:CourseStructure){return {modules:tree.modules.map(m=>({id:m.id,lessons:m.lessons.map(l=>({id:l.id,blocks:l.blocks.map(b=>b.id)}))}))};}
/** Operación pura y testeable; nunca mueve elementos fuera del curso. */
export function moveInTree(tree:CourseStructure,kind:'module'|'lesson'|'block',id:number,targetParent:number|null,targetIndex:number):CourseStructure {
  const modules=tree.modules.map(m=>({...m,lessons:m.lessons.map(l=>({...l,blocks:[...l.blocks]}))}));
  if(kind==='module'){
    const at=modules.findIndex(m=>m.id===id);if(at<0)return tree;
    const [item]=modules.splice(at,1);modules.splice(Math.max(0,Math.min(targetIndex,modules.length)),0,item);
  }else if(kind==='lesson'){
    const old=modules.find(m=>m.lessons.some(l=>l.id===id)),dest=modules.find(m=>m.id===targetParent);
    if(!old||!dest)return tree;
    const at=old.lessons.findIndex(l=>l.id===id);const [item]=old.lessons.splice(at,1);
    dest.lessons.splice(Math.max(0,Math.min(targetIndex,dest.lessons.length)),0,item);
  }else{
    const lessons=modules.flatMap(m=>m.lessons);
    const old=lessons.find(l=>l.blocks.some(b=>b.id===id)),dest=lessons.find(l=>l.id===targetParent);
    if(!old||!dest)return tree;
    const at=old.blocks.findIndex(b=>b.id===id);const [item]=old.blocks.splice(at,1);
    dest.blocks.splice(Math.max(0,Math.min(targetIndex,dest.blocks.length)),0,item);
  }
  return {course_id:tree.course_id,modules};
}
export function isFuture(date:string|null,now=Date.now()){return !!date&&Number.isFinite(Date.parse(date))&&Date.parse(date)>now;}
export function youtubeId(url:string):string|null {
  try{const p=new URL(url);if(p.protocol!=='https:')return null;const host=p.hostname.toLowerCase();let raw='';
    if(host==='youtu.be'||host==='www.youtu.be')raw=p.pathname.slice(1);
    else if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
      raw=p.pathname==='/watch'?p.searchParams.get('v')||'':/^(\/embed\/|\/shorts\/|\/live\/)/.test(p.pathname)?p.pathname.split('/')[2]:'';
    }
    return /^[\w-]{11}$/.test(raw)?raw:null;
  }catch{return null;}
}
