import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState, sameOriginRequest, SESSION_COOKIE } from "@/lib/auth/server";
import { isTenantAdmin } from "@/lib/policies/types";

export function userApiError(status: number, message: string): NextResponse {
  return NextResponse.json({ message }, { status, headers: { "Cache-Control": "private, no-store" } });
}

/** AUTH y TENANT se revalidan en backend; rechaza VISITOR y políticas pendientes. */
export async function authorizeUserAdmin(request: NextRequest): Promise<
  { token: string; tenantId: number; currentUserId: number } | { response: NextResponse }
> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return { response: userApiError(401, "Sesión requerida") };
  try {
    const state = await authState(await resolveTenant(), token);
    if (state.status === "unauthenticated") return { response: userApiError(401, "Sesión inválida o vencida") };
    if (state.status === "pending") return { response: userApiError(428, "Acepta las políticas obligatorias antes de continuar") };
    if (state.status === "unavailable") return { response: userApiError(503, "No fue posible verificar la sesión") };
    if (!isTenantAdmin(state.user.role)) return { response: userApiError(403, "Acceso exclusivo para administradores") };
    return { token, tenantId: state.user.business_id, currentUserId: state.user.id };
  } catch {
    return { response: userApiError(503, "No fue posible verificar la academia o la sesión") };
  }
}

export function verifyMutationOrigin(request: NextRequest): NextResponse | null {
  if (!sameOriginRequest(request)) return userApiError(403, "Origen no permitido");
  const type = request.headers.get("content-type")?.split(";")[0]?.toLowerCase();
  if (request.method !== "DELETE" && type !== "application/json") {
    return userApiError(415, "Se requiere application/json");
  }
  return null;
}

/** Lectura limitada: evita JSON arbitrariamente grande antes de parsear. */
export async function limitedJson(request: NextRequest, maxBytes = 8192): Promise<
  { value: unknown } | { response: NextResponse }
> {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > maxBytes) return { response: userApiError(413, "Solicitud demasiado grande") };
  if (!request.body) return { response: userApiError(400, "Faltan datos") };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return { response: userApiError(413, "Solicitud demasiado grande") };
      }
      chunks.push(value);
    }
    const raw = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
    return { value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)) };
  } catch {
    return { response: userApiError(400, "JSON inválido") };
  } finally {
    reader.releaseLock();
  }
}

export function userIdFromPath(raw: string): number | null {
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/** Errores de negocio conservan códigos 4xx; nunca mostrar fallos internos del backend. */
export async function upstreamUserError(response: Response): Promise<NextResponse> {
  const status = [400, 401, 403, 404, 409, 422, 428].includes(response.status) ? response.status : 502;
  let message = status === 409 ? "Ya existe un usuario con esos datos" :
    status === 404 ? "Usuario no encontrado" :
    status === 422 ? "Revisa los datos enviados" :
    status === 403 ? "No tienes autorización" :
    status === 428 ? "Debes aceptar las políticas pendientes" :
    "No se pudo completar la operación";
  if ([400, 409, 422].includes(status)) {
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body) {
        const detail = (body as { detail: unknown }).detail;
        if (typeof detail === "string" && detail.length <= 300) message = detail;
        // Los errores de Pydantic se transforman en un mensaje acotado.
        if (Array.isArray(detail) && detail.length && typeof detail[0]?.msg === "string") {
          message = detail[0].msg.slice(0, 200);
        }
      }
    } catch { /* No revelar respuestas malformadas */ }
  }
  return userApiError(status, message);
}
