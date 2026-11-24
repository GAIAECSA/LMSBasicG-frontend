import { NextRequest } from 'next/server';
import { authorize,output,error,upstream } from '@/lib/academic/bff';
import { parseCourseType,parseList } from '@/lib/academic/types';
import { apiFetch } from '@/lib/auth/backend';
export const runtime='nodejs';
export async function GET(request:NextRequest){const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 try {
  const response=await apiFetch('/api/v1/course-types',ctx.token);
  if(!response.ok)return upstream(response);
  const types=parseList(await response.json(),parseCourseType);
  if(!types)return error(502,'Respuesta inesperada de tipos de curso');
  return output({types,allowed:ctx.allowed});
 }catch{return error(503,'No se pudieron consultar los tipos');}
}
