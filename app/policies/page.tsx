import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { PolicyWizard } from "@/components/auth/policy-wizard";

export const metadata = {title:"Políticas pendientes"};
export default async function PoliciesPage() {
  const tenant = await resolveTenant();
  const state = await authState(tenant);
  if (state.status === "unauthenticated") redirect("/login");
  if (state.status === "ready") redirect("/campus");
  if (state.status === "unavailable") return <main className="state-page" role="alert">No se pueden comprobar las políticas. Vuelve a cargar la página.</main>;
  return <PolicyWizard tenant={tenant} initialPending={state.pending} />;
}
