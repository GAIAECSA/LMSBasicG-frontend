import { NextRequest, NextResponse } from 'next/server';
import { backendBaseUrl } from '@/lib/backend/config';
import { parseCourseCoverPath } from '@/lib/academic/course-cover-url';
import { resolveTenant } from '@/lib/tenant/resolve';

export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const notFound = () => new NextResponse(null, {
  status: 404,
  headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

/**
 * Proxy PÚBLICO de portadas para el tenant del dominio actual.
 * No requiere JWT, rol ni estado de políticas: las portadas pueden ser vistas
 * por ADMIN, VISITOR y usuarios anónimos, incluso en borradores.
 *
 * `id` preserva el contrato de ruta del frontend, pero no se usa como prueba
 * de propiedad de la imagen. La ruta es pública: FastAPI comprueba que el
 * archivo está referenciado por un curso no eliminado de un tenant activo.
 * La ruta /uploads/... está validada estrictamente: NO es un proxy HTTP abierto.
 *
 * NOTA: las imágenes de cursos en borrador darán 404 hasta quitar el filtro
 * Course.is_published del endpoint público en app/main.py (backend).
 */
export async function GET(request: NextRequest, { params }: Context) {
  const rawId = (await params).id;
  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(Number(rawId))) return notFound();

  const cover = parseCourseCoverPath(request.nextUrl.searchParams.get('path'));
  if (!cover) return notFound();

  try {
    const tenant = await resolveTenant();
    if (tenant.id !== cover.tenantId) return notFound();

    // Siempre se solicita una ruta local canónica en el origen CONFIGURADO;
    // el navegador jamás controla el hostname del upstream.
    const upstream = await fetch(`${backendBaseUrl()}${cover.path}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'image/png, image/jpeg, image/webp' },
      redirect: 'error',
    });
    if (upstream.status === 404) return notFound();
    if (!upstream.ok) return new NextResponse(null, { status: 502 });

    const mime = upstream.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (!mime || !ALLOWED_MIME.has(mime)) return new NextResponse(null, { status: 502 });
    const declaredLength = upstream.headers.get('content-length');
    if (declaredLength !== null && Number(declaredLength) > MAX_IMAGE_BYTES) {
      await upstream.body?.cancel();
      return new NextResponse(null, { status: 502 });
    }
    if (!upstream.body) return new NextResponse(null, { status: 502 });

    // Cortamos la lectura en 5 MiB aunque FastAPI omita Content-Length.
    const reader = upstream.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        size += part.value.byteLength;
        if (size > MAX_IMAGE_BYTES) {
          await reader.cancel();
          return new NextResponse(null, { status: 502 });
        }
        chunks.push(part.value);
      }
    } finally {
      reader.releaseLock();
    }

    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return new NextResponse(bytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=60',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new NextResponse(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
