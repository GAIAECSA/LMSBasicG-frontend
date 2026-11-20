import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { getTenantPublicCourses } from "@/lib/courses";
import { CampusShell } from "@/components/campus/campus-shell";
import { VisitorCatalog } from "@/components/campus/visitor-catalog";

export const metadata = { title: "Cursos" };
export default async function VisitorCatalogPage() {
  const tenant=await resolveTenant();
  const state=await authState(tenant);
  if (state.status==="unauthenticated")redirect("/login");
  if (state.status==="pending")redirect("/policies");
  if (state.status==="unavailable")return <main className="state-page" role="alert">No fue posible verificar la sesión.</main>;
  if (state.user.role.code!=="VISITOR"||state.user.role.scope!=="PLATFORM")redirect("/campus");
  const result=await getTenantPublicCourses(tenant.tenantDomain);
  return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
    <VisitorCatalog courses={result.courses} status={result.status}/>
  </CampusShell>;
}
