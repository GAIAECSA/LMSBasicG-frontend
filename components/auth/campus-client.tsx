"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import type { TenantPublic } from "@/lib/tenant/types";

type User = { username: string; firstname: string; lastname: string; business_id: number };

/** Pantalla mínima de sesión; los módulos administrativos del frontend legacy NO se migran en esta entrega. */
export function CampusClient({ tenant }: { tenant: TenantPublic }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Sin sesión")))
      .then((value) => { if (active && value.user?.business_id === tenant.id) setUser(value.user); else if (active) router.replace("/login"); })
      .catch(() => { if (active) router.replace("/login"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tenant.id, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }
  return <main className="auth-page"><div className="auth-card">
    <div className="auth-brand"><BrandLogo name={tenant.name} logoUrl={tenant.logoUrl} /><span>{tenant.name}</span></div>
    {loading ? <p>Verificando sesión…</p> : user ? <>
      <h1>Hola, {user.firstname}</h1><p>Ingresaste correctamente al campus de {tenant.name}.</p>
      <div className="campus-notice">La portada y autenticación multi-tenant ya están listas. Los módulos internos de administración, docencia y estudiantes se incorporarán en las siguientes fases de la refactorización.</div>
      <div className="campus-actions"><Link href="/" className="button button-secondary">Explorar cursos</Link><button onClick={logout} className="button button-primary"><LogOut size={18}/> Cerrar sesión</button></div>
    </> : null}
  </div></main>;
}
