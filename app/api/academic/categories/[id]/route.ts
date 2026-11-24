import { NextRequest } from 'next/server';
import { authorize,error,json,mutation,postJson,upstreamJson,validCategoriesBody,validIdPath } from '@/lib/academic/bff';
import { parseCategory } from '@/lib/academic/types';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,{params}:Context){const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 if(!validCategoriesBody(body.value))return error(400,'Nombre inválido');
 return upstreamJson(`/api/v1/categories/${id}`,ctx.token,parseCategory,{method:'PATCH',...postJson({name:body.value.name.trim()})});}
export async function DELETE(request:NextRequest,{params}:Context){const invalid=mutation(request,'any');if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson(`/api/v1/categories/${id}`,ctx.token,()=>null,{method:'DELETE'});}
