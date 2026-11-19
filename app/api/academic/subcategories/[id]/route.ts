import { NextRequest } from 'next/server';
import { authorize,error,json,mutation,postJson,upstreamJson,validSubcategoriesBody,validIdPath } from '@/lib/academic/bff';
import { parseSubcategory } from '@/lib/academic/types';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
export async function PATCH(request:NextRequest,{params}:Context){const invalid=mutation(request);if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 if(!validSubcategoriesBody(body.value))return error(400,'Nombre o categoría inválidos');
 return upstreamJson(`/api/v1/subcategories/${id}`,ctx.token,parseSubcategory,{method:'PATCH',...postJson({name:body.value.name.trim(),category_id:body.value.category_id})});}
export async function DELETE(request:NextRequest,{params}:Context){const invalid=mutation(request,'any');if(invalid)return invalid;
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson(`/api/v1/subcategories/${id}`,ctx.token,()=>null,{method:'DELETE'});}
