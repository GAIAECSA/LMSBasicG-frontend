import { backendBaseUrl } from "../backend/config";
import { buildTenant } from "./branding";
import { createAsyncTtlCache } from "./ttl-cache";
import type { TenantPublic } from "./types";
import { validTenantForHost } from "./validation";

export class TenantNotFoundError extends Error {
  constructor() { super("Academia no encontrada"); this.name = "TenantNotFoundError"; }
}

/** Datos públicos del tenant, particionados por dominio y validados contra FastAPI.
 * TTL 20 s: evita consultar la BD en cada petición RSC/BFF/heartbeat y mantiene
 * un margen pequeño de cambios de branding/dominio. No hay fallback obsoleto.
 */
const tenantCache = createAsyncTtlCache<TenantPublic>(20_000, 128);

const retryable = new Set([429, 502, 503, 504]);
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function fetchTenant(hostname: string): Promise<TenantPublic> {
  const url = `${backendBaseUrl()}/api/v1/tenant/resolve?domain=${encodeURIComponent(hostname)}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    let result: Response;
    try {
      result = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6500) });
    } catch (error) {
      if (attempt === 0) { await pause(180); continue; }
      console.error("[athena/tenant] Resolución no disponible para el hostname:", hostname,
        error instanceof Error ? error.name : "network_error");
      throw new Error("Servicio de academias no disponible temporalmente");
    }

    if (result.status === 404) throw new TenantNotFoundError();
    if (retryable.has(result.status) && attempt === 0) { await pause(180); continue; }
    if (!result.ok) {
      console.error("[athena/tenant] Respuesta fallida:", hostname, "HTTP", result.status);
      throw new Error(`Servicio de academias respondió HTTP ${result.status}`);
    }
    let payload: unknown;
    try { payload = await result.json(); }
    catch { throw new Error("Respuesta JSON inválida al resolver academia"); }
    if (!validTenantForHost(payload, hostname)) {
      // Respuesta inesperada o de otro dominio: NUNCA aceptar ni hacer fallback.
      console.error("[athena/tenant] Contrato de dominio inválido:", hostname);
      throw new Error("El servicio devolvió una academia no correspondiente al dominio solicitado");
    }
    return buildTenant(payload);
  }
  throw new Error("Servicio de academias no disponible");
}

/** Solo usar con hostname previamente normalizado desde el Host real. */
export function lookupTenant(hostname: string): Promise<TenantPublic> {
  return tenantCache.get(hostname, () => fetchTenant(hostname));
}
