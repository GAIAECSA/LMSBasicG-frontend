import { NextRequest } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize,error,mutation,multipart,upstream,upstreamJson,output } from '@/lib/academic/bff';
import { parseCourse,parseCourseType,parseList } from '@/lib/academic/types';
import { validateCourseForm } from '@/lib/academic/course-form';
export const runtime='nodejs';
export async function GET(request:NextRequest){const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson('/api/v1/courses',ctx.token,v=>parseList(v,parseCourse));}
export async function POST(request:NextRequest){const invalid=mutation(request,'form');if(invalid)return invalid;
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const upload=await multipart(request);if('response'in upload)return upload.response;
 const validated=validateCourseForm(upload.form,'create');if('response'in validated)return validated.response;
 try {
  const typesResponse=await apiFetch('/api/v1/course-types',ctx.token);
  if(!typesResponse.ok)return upstream(typesResponse);
  const types=parseList(await typesResponse.json(),parseCourseType);
  if(!types)return error(502,'Tipos de curso inválidos');
  const type=types.find(t=>t.id===validated.courseTypeId);
  if(!type||!ctx.allowed.includes(type.code))return error(403,'Tu plan no habilita crear cursos de este tipo');
  const response=await apiFetch('/api/v1/courses',ctx.token,{method:'POST',body:validated.data});
  if(!response.ok)return upstream(response);
  const course=parseCourse(await response.json());
  if(!course||course.course_type_id!==type.id||course.is_published)return error(502,'FastAPI devolvió un curso distinto al solicitado');
  return output(course,201);
 }catch{return error(503,'No fue posible crear el curso');}
}
