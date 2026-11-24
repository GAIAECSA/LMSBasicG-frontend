import { NextRequest, NextResponse } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { SESSION_COOKIE } from "@/lib/auth/server";
import { isTenantAdmin } from "./types";
import { PolicyBackendError } from "./backend";

/** La comprobación real del JWT, jti y rol se hace en FastAPI desde authState().
 * Ningún endpoint de administración se habilita por leer/decodificar un JWT en Next.
 */
export async function protectedPolicyRequest(request:NextRequest, admin:boolean):Promise<{token:string}|{response:NextResponse}> {
  const tenant=await resolveTenant();
  const token=request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return {response:failed(401,"Sesión requerida")};
  const state=await authState(tenant,token);
  if (state.status==="unauthenticated") return {response:failed(401,"Sesión inválida o vencida")};
  if (state.status==="pending") return {response:failed(428,"Debes aceptar las políticas pendientes")};
  if (state.status==="unavailable") return {response:failed(503,"No fue posible verificar la sesión")};
  if (admin && !isTenantAdmin(state.user.role)) return {response:failed(403,"Solo el administrador puede gestionar políticas")};
  return {token};
}

export function failed(status:number,message:string) {
  return NextResponse.json({message},{status,headers:{"Cache-Control":"private, no-store"}});
}
export function upstreamFailure(error:unknown) {
  if (error instanceof PolicyBackendError) return failed(error.status===401?401:error.status===403?403:error.status===428?428:502,
    error.status===428?"Hay políticas pendientes de aceptar":"No fue posible cargar las políticas del backend");
  return failed(503,"Servicio de políticas temporalmente no disponible");
}
export function numericId(raw:string):number|null {
  const value=Number(raw);
  return Number.isSafeInteger(value)&&value>0 ? value : null;
}
export async function safeError(response:Response, fallback:string):Promise<string> {
  // Mostrar solo errores de validación/negocio; no propagar trazas ni datos internos.
  if (![400,409,413,422].includes(response.status)) return fallback;
  try {
    const payload:unknown=await response.json();
    const value=payload && typeof payload==="object" ? (payload as {detail?:unknown}).detail : null;
    if (typeof value==="string" && value.length<300) return value;
  } catch {}
  return fallback;
}
