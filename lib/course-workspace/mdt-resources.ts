/** Contratos del módulo Recursos MDT. Esta capa no calcula notas, estados de
 * matrícula ni permisos: FastAPI es la autoridad y las respuestas se validan.
 */
export type MdtResourceKind='homework'|'pdf';
export type MdtStudentStatus='TODOS'|'ENTREGADO'|'PENDIENTE';
export type MdtResourceBlock={
  id:number;title:string;instructions:string|null;order:number;is_active:boolean;
  kind:MdtResourceKind;updated_at:string|null;
  uploaded_students:number|null;total_students:number|null;
  has_file:boolean|null;filename:string|null;can_preview:boolean;
};
export type MdtResourcesSummary={course_id:number;student_documents:MdtResourceBlock[];institutional_pdfs:MdtResourceBlock[]};
export type MdtAttachment={id:number;original_filename:string;content_type:string;size:number;can_preview:boolean};
export type MdtHomeworkResponse={
  id:number;enrollment_id:number;lesson_block_id:number;comment:string|null;
  created_at:string;updated_at:string;attachments:MdtAttachment[];
};
export type MdtStudentDocument={
  enrollment_id:number;user_id:number;firstname:string;lastname:string;
  username:string;email:string|null;submitted:boolean;
  legacy_requires_migration:boolean;requires_pdf_update:boolean;response:MdtHomeworkResponse|null;
};
export type MdtStudentDocumentPage={
  course_id:number;lesson_block_id:number;page:number;page_size:number;total:number;
  items:MdtStudentDocument[];
};
export type MdtPdfUploadResponse={lesson_block_id:number;filename:string;is_active:boolean;updated_at:string|null};
export type MdtResourceEvent={
  id:number;course_id:number;lesson_block_id:number;actor_user_id:number;
  enrollment_id:number|null;homework_response_id:number|null;action:string;created_at:string;
};
export type MdtResourceEventPage={page:number;page_size:number;total:number;items:MdtResourceEvent[]};

const rec=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const id=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>0;
const count=(v:unknown):v is number=>Number.isSafeInteger(v)&&Number(v)>=0;
const optionalText=(v:unknown):v is string|null=>v===null||typeof v==='string';
const optionalCount=(v:unknown):v is number|null=>v===null||count(v);
const when=(v:unknown):v is string|null=>optionalText(v);
const problem=(name:string):never=>{throw Error(`Respuesta de Recursos MDT inválida: ${name}.`);};

function block(raw:unknown,kind:MdtResourceKind):MdtResourceBlock{
  if(!rec(raw)||!id(raw.id)||raw.kind!==kind||typeof raw.title!=='string'||
    !optionalText(raw.instructions)||!count(raw.order)||typeof raw.is_active!=='boolean'||!when(raw.updated_at))
    return problem('bloque');
  if(kind==='homework'&&(!count(raw.total_students)||!count(raw.uploaded_students)||
    (raw.uploaded_students as number)>(raw.total_students as number)))return problem('contadores');
  if(kind==='pdf'&&(typeof raw.has_file!=='boolean'||!optionalText(raw.filename)))return problem('PDF');
  return {
    id:raw.id,title:raw.title,instructions:raw.instructions,order:raw.order,
    is_active:raw.is_active,kind,updated_at:raw.updated_at,
    uploaded_students:optionalCount(raw.uploaded_students)?raw.uploaded_students:null,
    total_students:optionalCount(raw.total_students)?raw.total_students:null,
    has_file:typeof raw.has_file==='boolean'?raw.has_file:null,
    filename:optionalText(raw.filename)?raw.filename:null,
    // Las URL privadas de FastAPI no se devuelven al navegador: solo su capacidad.
    // Los enlaces se construyen bajo el mismo origen, mediante el BFF autenticado.
    can_preview:kind==='pdf'&&raw.has_file===true&&typeof raw.preview_url==='string'&&raw.preview_url.length>0,
  };
}
export function readMdtSummary(value:unknown,courseId:number):MdtResourcesSummary{
  if(!rec(value)||value.course_id!==courseId||!Array.isArray(value.student_documents)||
    !Array.isArray(value.institutional_pdfs))return problem('resumen');
  const student_documents=value.student_documents.map(v=>block(v,'homework'));
  const institutional_pdfs=value.institutional_pdfs.map(v=>block(v,'pdf'));
  const all=[...student_documents,...institutional_pdfs];
  if(new Set(all.map(item=>item.id)).size!==all.length)return problem('bloques repetidos');
  return {course_id:courseId,student_documents,institutional_pdfs};
}
function attachment(v:unknown):MdtAttachment{
  if(!rec(v)||!id(v.id)||typeof v.original_filename!=='string'||!v.original_filename.trim()||
    typeof v.content_type!=='string'||!count(v.size))return problem('adjunto');
  // Jamás usamos download_url devuelto por FastAPI: el navegador descarga por
  // rutas same-origin BFF construidas únicamente con IDs verificados.
  return {id:v.id,original_filename:v.original_filename,content_type:v.content_type,size:v.size,
    can_preview:typeof v.preview_url==='string'&&v.preview_url.length>0};
}
export function readMdtHomeworkResponse(v:unknown):MdtHomeworkResponse{
  if(!rec(v)||!id(v.id)||!id(v.enrollment_id)||!id(v.lesson_block_id)||
    !optionalText(v.comment)||typeof v.created_at!=='string'||
    typeof v.updated_at!=='string'||!Array.isArray(v.attachments))return problem('entrega');
  return {id:v.id,enrollment_id:v.enrollment_id,lesson_block_id:v.lesson_block_id,
    comment:v.comment,created_at:v.created_at,updated_at:v.updated_at,
    attachments:v.attachments.map(attachment)};
}
export function readMdtStudents(v:unknown,courseId:number,blockId:number):MdtStudentDocumentPage{
  if(!rec(v)||v.course_id!==courseId||v.lesson_block_id!==blockId||!id(v.page)||
    !id(v.page_size)||v.page_size>100||!count(v.total)||!Array.isArray(v.items)||
    v.items.length>v.page_size)return problem('lista de estudiantes');
  const items:MdtStudentDocument[]=v.items.map(raw=>{
    if(!rec(raw)||!id(raw.enrollment_id)||!id(raw.user_id)||typeof raw.firstname!=='string'||
      typeof raw.lastname!=='string'||typeof raw.username!=='string'||!optionalText(raw.email)||
      typeof raw.submitted!=='boolean'||typeof raw.legacy_requires_migration!=='boolean'||
      typeof raw.requires_pdf_update!=='boolean')
      return problem('estudiante');
    const response=raw.response===null?null:readMdtHomeworkResponse(raw.response);
    if(response&&(response.enrollment_id!==raw.enrollment_id||response.lesson_block_id!==blockId))return problem('propiedad de entrega');
    if(raw.submitted!==!!response?.attachments.length)return problem('estado de entrega');
    return {enrollment_id:raw.enrollment_id,user_id:raw.user_id,
      firstname:raw.firstname,lastname:raw.lastname,username:raw.username,email:raw.email,
      submitted:raw.submitted,legacy_requires_migration:raw.legacy_requires_migration,
      requires_pdf_update:raw.requires_pdf_update,response};
  });
  if(new Set(items.map(item=>item.enrollment_id)).size!==items.length)return problem('matrículas repetidas');
  return {course_id:courseId,lesson_block_id:blockId,page:v.page,page_size:v.page_size,total:v.total,items};
}
export function readMdtPdfUpload(v:unknown,blockId:number):MdtPdfUploadResponse{
  if(!rec(v)||v.lesson_block_id!==blockId||typeof v.filename!=='string'||!v.filename||
    typeof v.is_active!=='boolean'||!when(v.updated_at))return problem('actualización PDF');
  return {lesson_block_id:blockId,filename:v.filename,is_active:v.is_active,updated_at:v.updated_at};
}
export function readMdtEvents(v:unknown):MdtResourceEventPage{
  if(!rec(v)||!id(v.page)||!id(v.page_size)||v.page_size>100||!count(v.total)||
    !Array.isArray(v.items)||v.items.length>v.page_size)return problem('historial');
  const items:MdtResourceEvent[]=v.items.map(raw=>{
    if(!rec(raw)||!id(raw.id)||!id(raw.course_id)||!id(raw.lesson_block_id)||
      !id(raw.actor_user_id)||!(raw.enrollment_id===null||id(raw.enrollment_id))||
      !(raw.homework_response_id===null||id(raw.homework_response_id))||
      typeof raw.action!=='string'||typeof raw.created_at!=='string')return problem('evento');
    return {id:raw.id,course_id:raw.course_id,lesson_block_id:raw.lesson_block_id,
      actor_user_id:raw.actor_user_id,enrollment_id:raw.enrollment_id,
      homework_response_id:raw.homework_response_id,action:raw.action,created_at:raw.created_at};
  });
  return {page:v.page,page_size:v.page_size,total:v.total,items};
}

/** URLs únicas del BFF same-origin. Nunca utilizar URLs de medios devueltas por FastAPI. */
export const mdtUrl=(courseId:number)=>`/api/mdt-resources/courses/${courseId}`;
export const mdtAttachmentUrl=(courseId:number,attachmentId:number)=>
  `${mdtUrl(courseId)}/attachments/${attachmentId}/download`;
export const mdtAttachmentPreviewUrl=(courseId:number,attachmentId:number)=>
  `${mdtUrl(courseId)}/attachments/${attachmentId}/preview`;
export const mdtPdfUrl=(courseId:number,blockId:number)=>
  `${mdtUrl(courseId)}/pdf/${blockId}/download`;
export const mdtPdfPreviewUrl=(courseId:number,blockId:number)=>
  `${mdtUrl(courseId)}/pdf/${blockId}/preview`;
export const MAX_MDT_PDF=25*1024*1024;
/** Regla MDT, no altera la validación de Homework académico normal. */
export function validateMdtFiles(files:readonly Pick<File,'name'|'size'>[],kind:MdtResourceKind):string|null{
  if(files.length!==1)return `Selecciona exactamente un archivo PDF para ${kind==='homework'?'el estudiante':'la evidencia institucional'}.`;
  const file=files[0];
  if(!/\.pdf$/i.test(file.name))return 'El documento debe ser PDF.';
  if(!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_MDT_PDF)
    return `«${file.name}» debe tener entre 1 byte y 25 MiB.`;
  // FastAPI vuelve a verificar MIME y firma real %PDF- (el atributo accept no es seguridad).
  return null;
}
