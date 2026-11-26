import { NextRequest,NextResponse } from 'next/server';
import { backendBaseUrl } from '@/lib/backend/config';
import { normalizeHostname } from '@/lib/tenant/hostname';
export const runtime='nodejs';
export async function GET(request:NextRequest){
 const host=normalizeHostname(request.headers.get('host')),query=request.nextUrl.searchParams;
 if(!host||query.getAll('domain').length!==1||query.get('domain')!==host||[...query.keys()].some(k=>k!=='domain'&&k!=='v')||query.getAll('v').length>1)return new NextResponse(null,{status:404});
 try{
  const url=new URL('/api/v1/tenant/logo',backendBaseUrl());url.searchParams.set('domain',host);
  const version=query.get('v');if(version)url.searchParams.set('v',version);
  const result=await fetch(url,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30_000)});
  if(!result.ok)return new NextResponse(null,{status:result.status===404?404:502});
  const type=result.headers.get('content-type')||'';
  if(!['image/png','image/jpeg','image/webp'].includes(type)||!result.body)return new NextResponse(null,{status:502});
  return new NextResponse(result.body,{headers:{'Content-Type':type,'Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
 }catch{return new NextResponse(null,{status:503});}
}
