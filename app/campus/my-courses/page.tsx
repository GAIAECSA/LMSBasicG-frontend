import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { CampusShell } from "@/components/campus/campus-shell";
import { VisitorMyCourses } from "@/components/campus/visitor-my-courses";
import { loadMyCourses } from "@/lib/visitor/data";

export const metadata = { title: "Mis cursos" };
export default async function MyCoursesPage() {
  const tenant = await resolveTenant();
  const state = await authState(tenant);
  if (state.status === "unauthenticated") redirect("/login");
  if (state.status === "pending") redirect("/policies");
  if (state.status === "unavailable") return <main className="state-page" role="alert">No fue posible verificar la sesión.</main>;
  if (state.user.role.code !== "VISITOR" || state.user.role.scope !== "PLATFORM") redirect("/campus");
  const data = await loadMyCourses(tenant.tenantDomain, state.user.id);
  const name=[state.user.firstname,state.user.lastname].filter(Boolean).join(" ")||state.user.username;
  return <CampusShell tenant={tenant} user={state.user} expiresAt={state.expiresAt}>
    <VisitorMyCourses name={name} data={data}/>
  </CampusShell>;
}
