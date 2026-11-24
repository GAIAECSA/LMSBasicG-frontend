import type { TenantResponse } from "./types";

/** No permitir que una respuesta de otro dominio entre en la caché del host actual. */
export function validTenantForHost(data: unknown, hostname: string): data is TenantResponse {
  if (!data || typeof data !== "object") return false;
  const row = data as Partial<TenantResponse>;
  return typeof row.id === "number" && Number.isSafeInteger(row.id) && row.id > 0 &&
    row.matched_domain === hostname &&
    typeof row.tenant_domain === "string" && row.tenant_domain.toLowerCase() === hostname &&
    row.matched_domain_type === "TENANT" &&
    typeof row.name === "string" && Boolean(row.name.trim());
}
