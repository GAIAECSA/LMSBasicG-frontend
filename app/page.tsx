import { resolveTenant } from "@/lib/tenant/resolve";
import { getTenantPublicCourses } from "@/lib/courses";
import { HomeClient } from "@/components/public/home-client";

export default async function Home() {
  const tenant = await resolveTenant();
  const result = await getTenantPublicCourses(tenant.tenantDomain);
  return <HomeClient tenant={tenant} courses={result.courses} coursesStatus={result.status} />;
}
