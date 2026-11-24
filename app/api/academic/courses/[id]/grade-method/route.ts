import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize,error,json,mutation,postJson,upstream,output,validIdPath,isRecord } from '@/lib/academic/bff';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,{params}:Context){const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'Curso inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const input=await json(request);if('response'in input)return input.response;
 if(!isRecord(input.value)||!['AVERAGE','WEIGHTED'].includes(String(input.value.method))||Object.keys(input.value).length!==1)
  return error(400,'Método de calificación inválido');
 try{const response=await apiFetch(`/api/v1/quiz/courses/${id}/grade-method`,ctx.token,{method:'PATCH',...postJson(input.value)});
  if(!response.ok)return upstream(response);const body:unknown=await response.json();
  if(!isRecord(body)||body.method!==input.value.method||!Number.isSafeInteger(body.enrollments_recalculated))
   return error(502,'Resultado de recálculo inválido');
  return output({method:body.method,enrollments_recalculated:body.enrollments_recalculated});
 }catch{return error(503,'No fue posible actualizar el método');}
}
