import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { backendBaseUrl } from "../backend/config";
import { buildTenant } from "./branding";
import { normalizeHostname } from "./hostname";
import type { TenantPublic, TenantResponse } from "./types";

/** cache() deduplica lecturas del mismo tenant entre layout, metadata y page SOLO dentro de la petición. */
export const resolveTenant = cache(async (): Promise<TenantPublic> => {
  const host = normalizeHostname((await headers()).get("host"));
  if (!host) notFound();

  const url = `${backendBaseUrl()}/api/v1/tenant/resolve?domain=${encodeURIComponent(host)}`;
  // no-store evita fugas de branding entre peticiones o dominios. Se podrá introducir
  // caché particionada por hostname solamente después de diseñar invalidación.
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error(`No se pudo resolver la academia (HTTP ${response.status})`);

  const tenant = (await response.json()) as TenantResponse;
  // Comprobación defensiva ante una respuesta upstream errónea o mal configurada.
  if (!tenant || !Number.isInteger(tenant.id) || tenant.id <= 0 ||
      tenant.matched_domain !== host || tenant.tenant_domain?.toLowerCase() !== host ||
      tenant.matched_domain_type !== "TENANT" || typeof tenant.tenant_domain !== "string" ||
      typeof tenant.name !== "string" || !tenant.name.trim()) {
    throw new Error("Respuesta de tenant inválida o correspondiente a otro dominio");
  }
  return buildTenant(tenant);
});
