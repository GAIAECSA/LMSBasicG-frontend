import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { resolveTenant } from "@/lib/tenant/resolve";
import { tenantCssVars } from "@/lib/tenant/branding";
import "./globals.css";
import { NotificationProvider } from "@/components/ui/notifications";

// Metadata se genera por hostname, nunca queda fijada en el build para una academia.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await resolveTenant();
  return {
    title: { default: tenant.name, template: `%s | ${tenant.name}` },
    description: tenant.hero.description,
    robots: { index: true, follow: true },
    icons: { icon: tenant.logoUrl ?? "/favicon.svg" },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const tenant = await resolveTenant();
  return (
    <html lang="es">
      <body style={tenantCssVars(tenant.theme) as CSSProperties}>
        <NotificationProvider />
        {children}
      </body>
    </html>
  );
}
