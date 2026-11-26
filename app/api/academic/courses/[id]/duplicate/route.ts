import { NextRequest } from 'next/server';
import { authorize,error,mutation,json,postJson,upstreamJson,validIdPath } from '@/lib/academic/bff';
import { parseCourse } from '@/lib/academic/types';
import { parseDuplicateInput } from '@/lib/academic/course-duplicate';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){
 const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 const input=parseDuplicateInput(body.value);if(!input)return error(400,'Revisa el nombre y las fechas de la nueva edición');
 // El backend comprueba la licencia de la modalidad original y la pertenencia al tenant.
 // S3 puede demorar: timeout especial solo para esta mutación, sin reintentos automáticos.
 return upstreamJson(`/api/v1/courses/${id}/duplicate`,ctx.token,v=>{
  const course=parseCourse(v);
  return course&&course.id!==id&&course.name===input.name&&!course.is_published&&!course.open_enrollment&&course.total_students===0&&course.published_at===null?course:null;
 },{method:'POST',...postJson(input),signal:AbortSignal.timeout(240_000)},201);
}
