import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { apiFetch, jwtTenantAndExpiry } from "./backend";
import { AuthState, allowedLmsRole, parseModules, parsePendingPolicies, validUser } from "./types";
import type { TenantPublic } from "@/lib/tenant/types";

export const SESSION_COOKIE = "athena_lms_session";

/** Protección CSRF del BFF: solo formularios y acciones iniciadas por el origen visible del tenant. */
export function sameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const source = new URL(origin);
    return ["http:", "https:"].includes(source.protocol) && source.host.toLowerCase() === host.toLowerCase();
  } catch { return false; }
}

/** Cookie host-only. Nunca escribir Domain; HttpOnly evita exposición a JS. */
export function sessionCookieOptions(https: boolean, maxAge: number) {
  return {httpOnly:true, secure:https, sameSite:"lax" as const, path:"/", maxAge};
}

/** Consulta primero políticas, porque /users/me y /me/modules devuelven 428 mientras queden pendientes.
 * Cada llamada usa el backend como autoridad (revocación y cambios de rol efectivos en cada request).
 * 'unavailable' mantiene la aplicación cerrada si hay fallos de red: no debe parecer un logout.
 */
export async function authState(tenant: TenantPublic, token?: string): Promise<AuthState> {
  const current = token ?? (await cookies()).get(SESSION_COOKIE)?.value;
  if (!current) return {status:"unauthenticated"};
  const claims = jwtTenantAndExpiry(current);
  if (!claims || claims.businessId !== tenant.id) return {status:"unauthenticated"};
  try {
    const pendingResult = await apiFetch("/api/v1/policies/pending", current);
    if (pendingResult.status === 401 || pendingResult.status === 403) return {status:"unauthenticated"};
    if (!pendingResult.ok) return {status:"unavailable"};
    const pending = parsePendingPolicies(await pendingResult.json());
    if (!pending) return {status:"unavailable"};
    if (pending.length) return {status:"pending",pending,expiresAt:claims.expiresAt};

    const me = await apiFetch("/api/v1/users/me",current);
    if (me.status === 401 || me.status === 403) return {status:"unauthenticated"};
    if (me.status === 428) return await policiesAfterRace(current,claims.expiresAt);
    if (!me.ok) return {status:"unavailable"};
    const user: unknown = await me.json();
    if (!validUser(user) || user.business_id !== tenant.id || !allowedLmsRole(user.role)) {
      return {status:"unauthenticated"};
    }
    const moduleResponse = await apiFetch("/api/v1/business-lms-config/me/modules",current);
    if (moduleResponse.status === 401 || moduleResponse.status === 403) return {status:"unauthenticated"};
    if (moduleResponse.status === 428) return await policiesAfterRace(current,claims.expiresAt);
    if (!moduleResponse.ok) return {status:"unavailable"};
    const modules = parseModules(await moduleResponse.json());
    if (!modules) return {status:"unavailable"};
    return {status:"ready",user,modules,expiresAt:claims.expiresAt};
  } catch { return {status:"unavailable"}; }
}

/** Si una política aparece entre la primera lectura y /users/me, conducir al wizard. */
async function policiesAfterRace(token:string, expiresAt:string|null):Promise<AuthState> {
  try {
    const response=await apiFetch("/api/v1/policies/pending",token);
    if (response.status===401) return {status:"unauthenticated"};
    if (!response.ok) return {status:"unavailable"};
    const pending=parsePendingPolicies(await response.json());
    return pending?.length ? {status:"pending",pending,expiresAt} : {status:"unavailable"};
  } catch {return {status:"unavailable"};}
}
