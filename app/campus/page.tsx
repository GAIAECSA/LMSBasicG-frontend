import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { CampusClient } from "@/components/auth/campus-client";

export const metadata = {title:"Mi campus"};
export default async function CampusPage() {
  const tenant = await resolveTenant();
  const state = await authState(tenant);
  if (state.status === "unauthenticated") redirect("/login");
  if (state.status === "pending") redirect("/policies");
  if (state.status === "unavailable") return <main className="state-page" role="alert">No fue posible verificar la sesión. Actualiza para reintentar.</main>;
  // Por ahora NO se enruta por rol; la home futura podrá consumir los códigos/scope ya verificados.
  // Los módulos provienen de business_lms_config + lms_configs por el endpoint /me/modules.
  return <CampusClient tenant={tenant} user={state.user} modules={state.modules} expiresAt={state.expiresAt} />;
}
