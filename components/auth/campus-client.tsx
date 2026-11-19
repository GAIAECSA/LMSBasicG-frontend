"use client";

import type { TenantPublic } from "@/lib/tenant/types";
import type { AuthUser, TenantModule } from "@/lib/auth/types";
import { CampusShell } from "@/components/campus/campus-shell";
import { CampusHome } from "@/components/campus/campus-home";

/**
 * El servidor ya comprobó token revocable, business_id, políticas, rol y módulos
 * antes de renderizar este componente. El layout es compartido con /campus/policies.
 * La autoridad de acceso siempre es FastAPI + authState(), no el menú del cliente.
 */
export function CampusClient({ tenant, user, modules, expiresAt }: {
  tenant: TenantPublic;
  user: AuthUser;
  modules: TenantModule[];
  expiresAt: string | null;
}) {
  return (
    <CampusShell tenant={tenant} user={user} expiresAt={expiresAt}>
      <CampusHome tenant={tenant} user={user} modules={modules} />
    </CampusShell>
  );
}
