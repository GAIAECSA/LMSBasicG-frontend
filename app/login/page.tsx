import { resolveTenant } from "@/lib/tenant/resolve";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Iniciar sesión" };
export default async function LoginPage() {
  const tenant = await resolveTenant();
  return <LoginForm tenant={tenant} />;
}
