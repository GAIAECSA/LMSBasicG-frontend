import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize,error,json,mutation,upstream,postJson,output,validIdPath,isRecord } from '@/lib/academic/bff';
import { parseCourseType,parseList,parseCourse } from '@/lib/academic/types';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function POST(request:NextRequest,{params}:Context){const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'Curso inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const input=await json(request);if('response'in input)return input.response;
 const payload=input.value;
 if(!isRecord(payload)||!Number.isSafeInteger(payload.course_type_id)||
  (payload.course_type_id as number)<1||payload.confirm!==true||Object.keys(payload).length!==2)
  return error(400,'Se requiere confirmación explícita');
 try{const typesResponse=await apiFetch('/api/v1/course-types',ctx.token);if(!typesResponse.ok)return upstream(typesResponse);
  const types=parseList(await typesResponse.json(),parseCourseType);if(!types)return error(502,'Tipos inválidos');
  const type=types.find(t=>t.id===payload.course_type_id);if(!type||!ctx.allowed.includes(type.code))return error(403,'Tu plan no permite ese cambio');
  const response=await apiFetch(`/api/v1/courses/${id}/course-type/change`,ctx.token,{method:'POST',...postJson(payload)});
  if(!response.ok)return upstream(response);const course=parseCourse(await response.json());
  return course?.id===id&&course.course_type_id===type.id?output(course):error(502,'Respuesta de cambio inesperada');
 }catch{return error(503,'No fue posible cambiar el tipo');}
}
