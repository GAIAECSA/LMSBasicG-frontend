import { resolveTenant } from "@/lib/tenant/resolve";
import { CampusClient } from "@/components/auth/campus-client";

export const metadata = { title: "Mi campus" };
export default async function CampusPage() {
  const tenant = await resolveTenant();
  return <CampusClient tenant={tenant} />;
}
