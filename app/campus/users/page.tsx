import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { isTenantAdmin } from "@/lib/policies/types";
import { canAssignPlatformRoles } from "@/lib/users/permissions";
import { CampusShell } from "@/components/campus/campus-shell";
import { AdminUsers } from "@/components/campus/admin-users";

export const metadata = { title: "Gestión de usuarios" };

/** La página se protege también en SSR: ocultar el menú NO es un control de acceso. */
export default async function CampusUsersPage() {
  const tenant = await resolveTenant();
  const state = await authState(tenant);
  if (state.status === "unauthenticated") redirect("/login");
  if (state.status === "pending") redirect("/policies");
  if (state.status === "unavailable") return <main className="state-page" role="alert">No fue posible validar la sesión. Reintenta más tarde.</main>;
  if (!isTenantAdmin(state.user.role)) redirect("/campus");
  return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
    <AdminUsers tenantId={tenant.id} currentUserId={state.user.id} roleAssignmentEnabled={canAssignPlatformRoles()} />
  </CampusShell>;
}
