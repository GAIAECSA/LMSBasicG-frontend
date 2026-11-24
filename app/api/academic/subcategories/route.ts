import { NextRequest } from 'next/server';
import { authorize,error,json,mutation,postJson,upstreamJson,validSubcategoriesBody } from '@/lib/academic/bff';
import { parseSubcategory,parseList } from '@/lib/academic/types';
export const runtime='nodejs';
export async function GET(request:NextRequest){const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson('/api/v1/subcategories',ctx.token,v=>parseList(v,parseSubcategory));}
export async function POST(request:NextRequest){const invalid=mutation(request);if(invalid)return invalid;
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 if(!validSubcategoriesBody(body.value))return error(400,'Nombre o categoría inválidos');
 return upstreamJson('/api/v1/subcategories',ctx.token,parseSubcategory,{method:'POST',...postJson({name:body.value.name.trim(),category_id:body.value.category_id})},201);}
