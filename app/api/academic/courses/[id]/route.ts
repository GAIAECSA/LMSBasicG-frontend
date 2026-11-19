import { NextRequest } from 'next/server';
import { authorize,error,mutation,multipart,upstreamJson,validIdPath } from '@/lib/academic/bff';
import { parseCourse } from '@/lib/academic/types';
import { validateCourseForm } from '@/lib/academic/course-form';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function GET(request:NextRequest,{params}:Context){const id=validIdPath((await params).id);
 if(!id)return error(400,'ID inválido');const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson(`/api/v1/courses/${id}`,ctx.token,parseCourse);}
export async function PATCH(request:NextRequest,{params}:Context){const invalid=mutation(request,'form');if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const input=await multipart(request);if('response'in input)return input.response;
 const values=validateCourseForm(input.form,'update');if('response'in values)return values.response;
 return upstreamJson(`/api/v1/courses/${id}`,ctx.token,parseCourse,{method:'PATCH',body:values.data});}
export async function DELETE(request:NextRequest,{params}:Context){const invalid=mutation(request,'any');if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson(`/api/v1/courses/${id}`,ctx.token,()=>null,{method:'DELETE'});}
