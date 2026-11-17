"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TenantPublic } from "@/lib/tenant/types";
import type { AuthUser, TenantModule } from "@/lib/auth/types";
import { SessionMonitor } from "./session-monitor";

/** Home provisional: únicamente "Llegaste"; perfil/módulos resueltos en servidor para la siguiente fase. */
export function CampusClient({tenant,user,modules,expiresAt}: {
  tenant:TenantPublic; user:AuthUser; modules:TenantModule[]; expiresAt:string|null;
}) {
  const router = useRouter();
  const [closing,setClosing] = useState(false);
  async function logout() {
    setClosing(true);
    try { await fetch("/api/auth/logout",{method:"POST",cache:"no-store"}); } finally {
      router.replace("/login"); router.refresh();
    }
  }
  // Mantener estos datos disponibles, pero sin mostrar paneles que todavía no existen.
  void tenant; void user; void modules;
  return <main className="campus-blank">
    <SessionMonitor expiresAt={expiresAt}/>
    <h1>Llegaste</h1>
    <button onClick={logout} disabled={closing} type="button" className="campus-exit">
      {closing?"Cerrando sesión…":"Cerrar sesión"}
    </button>
  </main>;
}
