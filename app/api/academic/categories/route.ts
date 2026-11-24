import { NextRequest } from "next/server";
import { authorize,error,json,mutation,postJson,upstreamJson,validCategoriesBody } from "@/lib/academic/bff";
import { parseCategory,parseList } from "@/lib/academic/types";
export const runtime='nodejs';
export async function GET(request:NextRequest){const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 return upstreamJson('/api/v1/categories',ctx.token,v=>parseList(v,parseCategory));}
export async function POST(request:NextRequest){const invalid=mutation(request);if(invalid)return invalid;
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 const body=await json(request);if('response'in body)return body.response;
 if(!validCategoriesBody(body.value))return error(400,'Nombre de categoría inválido');
 return upstreamJson('/api/v1/categories',ctx.token,parseCategory,{method:'POST',...postJson({name:body.value.name.trim()})},201);}
