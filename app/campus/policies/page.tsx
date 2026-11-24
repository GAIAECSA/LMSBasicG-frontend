import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { isTenantAdmin } from "@/lib/policies/types";
import { CampusShell } from "@/components/campus/campus-shell";
import { AdminPolicies } from "@/components/campus/admin-policies";
import { MyPolicies } from "@/components/campus/my-policies";

export const metadata={title:"Políticas"};
export default async function CampusPoliciesPage() {
  const tenant=await resolveTenant();
  const state=await authState(tenant);
  if(state.status==="unauthenticated")redirect("/login");
  if(state.status==="pending")redirect("/policies");
  if(state.status==="unavailable")return <main className="state-page" role="alert">No fue posible comprobar la sesión. Actualiza e inténtalo nuevamente.</main>;
  // La vista y los endpoints admin requieren (code, scope); FastAPI repite esa validación.
  return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
    {isTenantAdmin(state.user.role)?<AdminPolicies/>:<MyPolicies/>}
  </CampusShell>;
}
