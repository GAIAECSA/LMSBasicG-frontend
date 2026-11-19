import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { canAssignPlatformRoles } from "@/lib/users/permissions";
import { legacyUpdatePayload, parseUser, validUpdateUser } from "@/lib/users/types";
import { authorizeUserAdmin, limitedJson, upstreamUserError, userApiError, userIdFromPath, verifyMutationOrigin } from "@/lib/users/route-guard";

export const runtime = "nodejs";

type Context = { params: Promise<{ userId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const invalidOrigin = verifyMutationOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const userId = userIdFromPath((await params).userId);
  if (!userId) return userApiError(400, "Identificador inválido");
  const context = await authorizeUserAdmin(request);
  if ("response" in context) return context.response;
  const payload = await limitedJson(request);
  if ("response" in payload) return payload.response;
  if (!validUpdateUser(payload.value)) return userApiError(400, "Datos de edición inválidos");
  const input = payload.value;
  if (userId === context.currentUserId && input.is_active === false) {
    return userApiError(400, "No puedes desactivar tu propia cuenta");
  }
  if (input.role_code !== undefined && !canAssignPlatformRoles()) {
    return userApiError(501, "El cambio de rol requiere una ampliación de FastAPI");
  }
  const body = canAssignPlatformRoles() ? input : legacyUpdatePayload(input);
  try {
    const response = await apiFetch(`/api/v1/users/${userId}`, context.token, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!response.ok) return upstreamUserError(response);
    const user = parseUser(await response.json(), context.tenantId);
    if (!user || user.id !== userId) return userApiError(502, "Respuesta inválida al actualizar el usuario");
    if (input.role_code && user.role.code !== input.role_code) {
      return userApiError(502, "FastAPI no aplicó el cambio de rol. Verifica la cuenta antes de reintentar");
    }
    return NextResponse.json({ user }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return userApiError(503, "No fue posible actualizar el usuario") }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const invalidOrigin = verifyMutationOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const userId = userIdFromPath((await params).userId);
  if (!userId) return userApiError(400, "Identificador inválido");
  const context = await authorizeUserAdmin(request);
  if ("response" in context) return context.response;
  if (userId === context.currentUserId) return userApiError(400, "No puedes eliminar tu propia cuenta");
  try {
    const response = await apiFetch(`/api/v1/users/${userId}`, context.token, { method: "DELETE" });
    if (!response.ok) return upstreamUserError(response);
    if (response.status !== 204) return userApiError(502, "Respuesta inválida al eliminar el usuario");
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  } catch { return userApiError(503, "No fue posible eliminar el usuario") }
}
