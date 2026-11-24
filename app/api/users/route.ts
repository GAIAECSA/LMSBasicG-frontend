import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/auth/backend";
import { canAssignPlatformRoles } from "@/lib/users/permissions";
import { legacyCreatePayload, parseUser, parseUsers, validCreateUser } from "@/lib/users/types";
import { authorizeUserAdmin, limitedJson, upstreamUserError, userApiError, verifyMutationOrigin } from "@/lib/users/route-guard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = await authorizeUserAdmin(request);
  if ("response" in context) return context.response;
  try {
    const response = await apiFetch("/api/v1/users", context.token);
    if (!response.ok) return upstreamUserError(response);
    const users = parseUsers(await response.json(), context.tenantId);
    if (!users) return userApiError(502, "El backend devolvió datos de usuarios inválidos");
    return NextResponse.json({ users }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return userApiError(503, "No fue posible consultar los usuarios") }
}

export async function POST(request: NextRequest) {
  const invalidOrigin = verifyMutationOrigin(request);
  if (invalidOrigin) return invalidOrigin;
  const context = await authorizeUserAdmin(request);
  if ("response" in context) return context.response;
  const payload = await limitedJson(request);
  if ("response" in payload) return payload.response;
  if (!validCreateUser(payload.value)) return userApiError(400, "Datos de creación inválidos");
  const input = payload.value;
  if (input.role_code === "ADMIN" && !canAssignPlatformRoles()) {
    return userApiError(501, "Para crear administradores hay que habilitar primero esta operación en FastAPI");
  }
  const roleEnabled = canAssignPlatformRoles();
  const body = roleEnabled ? input : legacyCreatePayload(input);
  try {
    const response = await apiFetch("/api/v1/users", context.token, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!response.ok) return upstreamUserError(response);
    const user = parseUser(await response.json(), context.tenantId);
    if (!user) return userApiError(502, "El backend devolvió un usuario inválido");
    if (user.role.code !== input.role_code) {
      return userApiError(502, "El backend no aplicó el rol solicitado. Revisa el usuario creado antes de reintentar");
    }
    return NextResponse.json({ user }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch { return userApiError(503, "No fue posible crear el usuario") }
}
