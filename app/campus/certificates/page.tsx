import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { CampusShell } from "@/components/campus/campus-shell";
import { VisitorCertificates } from "@/components/campus/visitor-certificates";

export const metadata = { title: "Certificados" };
export default async function VisitorCertificatesPage() {
  const tenant=await resolveTenant();
  const state=await authState(tenant);
  if(state.status==="unauthenticated")redirect("/login");
  if(state.status==="pending")redirect("/policies");
  if(state.status==="unavailable")return <main className="state-page" role="alert">No fue posible verificar la sesión.</main>;
  if(state.user.role.code!=="VISITOR"||state.user.role.scope!=="PLATFORM")redirect("/campus");
  return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
    <VisitorCertificates/>
  </CampusShell>;
}
