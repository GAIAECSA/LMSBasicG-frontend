import { redirect } from "next/navigation";
import { resolveTenant } from "@/lib/tenant/resolve";
import { authState } from "@/lib/auth/server";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {title:"Iniciar sesión"};
export default async function LoginPage() {
  const tenant = await resolveTenant();
  const state = await authState(tenant);
  if (state.status === "ready") redirect("/campus");
  if (state.status === "pending") redirect("/policies");
  return <LoginForm tenant={tenant} />;
}
