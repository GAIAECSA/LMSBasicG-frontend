import { resolveTenant } from "@/lib/tenant/resolve";
import { getTenantPublicCourses } from "@/lib/courses";
import { HomeClient } from "@/components/public/home-client";
import { CookieNotice } from "@/components/public/cookie-notice";

export default async function Home() {
  const tenant = await resolveTenant();
  const result = await getTenantPublicCourses(tenant.tenantDomain);
  return <><HomeClient tenant={tenant} courses={result.courses} coursesStatus={result.status} /><CookieNotice /></>;
}
