import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { normalizeHostname } from "./hostname";
import { lookupTenant, TenantNotFoundError } from "./lookup";
import type { TenantPublic } from "./types";

/** React.cache deduplica dentro de cada request; lookupTenant comparte resoluciones
 * públicas válidas entre requests del MISMO host durante un TTL corto.
 * La autorización y las políticas SIEMPRE se verifican contra FastAPI.
 */
export const resolveTenant = cache(async (): Promise<TenantPublic> => {
  const host = normalizeHostname((await headers()).get("host"));
  if (!host) notFound();
  try { return await lookupTenant(host); }
  catch (error) {
    if (error instanceof TenantNotFoundError) notFound();
    throw error;
  }
});
