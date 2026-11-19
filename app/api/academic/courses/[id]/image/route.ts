import { NextRequest,NextResponse } from 'next/server';
import { apiFetch } from '@/lib/auth/backend';
import { authorize,error,validIdPath } from '@/lib/academic/bff';
import { parseCourse } from '@/lib/academic/types';
export const runtime='nodejs';type Context={params:Promise<{id:string}>};
/** No es proxy abierto: solo admite rutas de imágenes asociadas a cursos publicados del tenant. */
export async function GET(request:NextRequest,{params}:Context){
 const id=validIdPath((await params).id);if(!id)return error(400,'ID inválido');
 const ctx=await authorize(request);if('response'in ctx)return ctx.response;
 try{
  const courseResponse=await apiFetch(`/api/v1/courses/${id}`,ctx.token);
  if(!courseResponse.ok)return error(404,'Imagen no encontrada');
  const course=parseCourse(await courseResponse.json());
  if(!course||!course.is_published||!course.image_url)return error(404,'Imagen no disponible');
  const pattern=new RegExp(`^/uploads/tenant_${ctx.tenantId}/courses/images/[0-9a-f]{32}\\.(?:jpg|jpeg|png|webp)$`);
  if(!pattern.test(course.image_url))return error(404,'Imagen no reconocida');
  const response=await apiFetch(course.image_url,ctx.token);
  if(!response.ok)return error(404,'Imagen no disponible');
  const mime=response.headers.get('content-type')?.split(';')[0];
  if(!mime||!['image/png','image/jpeg','image/webp'].includes(mime))return error(502,'Formato de imagen inesperado');
  const length=Number(response.headers.get('content-length'));
  if(Number.isFinite(length)&&length>5*1024*1024)return error(502,'Imagen demasiado grande');
  const bytes=await response.arrayBuffer();if(bytes.byteLength>5*1024*1024)return error(502,'Imagen demasiado grande');
  return new NextResponse(bytes,{status:200,headers:{'Content-Type':mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return error(503,'No se pudo mostrar la imagen');}
}
