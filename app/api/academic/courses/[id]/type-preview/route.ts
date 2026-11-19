import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize,error,json,mutation,upstream,postJson,output,validIdPath,isRecord } from '@/lib/academic/bff';
import { parseCourseType,parseList,parseTransition } from '@/lib/academic/types';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function POST(request:NextRequest,{params}:Context){const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'Curso inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const input=await json(request);if('response'in input)return input.response;
 const payload=input.value;
 if(!isRecord(payload)||!Number.isSafeInteger(payload.course_type_id)||
   (payload.course_type_id as number)<1||Object.keys(payload).length!==1)return error(400,'Tipo inválido');
 try{const typesResponse=await apiFetch('/api/v1/course-types',ctx.token);if(!typesResponse.ok)return upstream(typesResponse);
  const types=parseList(await typesResponse.json(),parseCourseType);if(!types)return error(502,'Tipos inválidos');
  const type=types.find(t=>t.id===payload.course_type_id);if(!type||!ctx.allowed.includes(type.code))return error(403,'Tu plan no permite cambiar a ese tipo');
  const response=await apiFetch(`/api/v1/courses/${id}/course-type/preview`,ctx.token,{method:'POST',...postJson(payload)});
  if(!response.ok)return upstream(response);const preview=parseTransition(await response.json());
  return preview?.course_id===id&&preview.target_type.id===type.id?output(preview):error(502,'Vista previa inesperada');
 }catch{return error(503,'No fue posible previsualizar el cambio');}
}
