"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/** No renueva tokens (FastAPI no ofrece refresh); detecta revocación, expiración y policies nuevas.
 * Este monitor es solo UX; la protección real está en los componentes servidor y FastAPI.
 */
export function SessionMonitor({expiresAt}: {expiresAt:string|null}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    async function verify() {
      if (stopped) return;
      if (expiresAt && Date.now() >= Date.parse(expiresAt)) {
        router.replace("/login?expired=1"); router.refresh(); return;
      }
      try {
        const res = await fetch("/api/auth/session",{cache:"no-store"});
        if (stopped) return;
        if (res.status === 401) {router.replace("/login?expired=1");router.refresh();return;}
        if (!res.ok) return; // Error de red: los routes server siguen cerrados.
        const data = await res.json();
        if (data.status === "pending" && pathname !== "/policies") {router.replace("/policies");router.refresh();}
        if (data.status === "ready" && pathname === "/policies") {router.replace("/campus");router.refresh();}
      } catch { /* Conexión indisponible: no suponer sesión válida ni borrarla. */ }
    }
    const handleFocus = () => {void verify();};
    window.addEventListener("focus",handleFocus);
    const timer = window.setInterval(() => void verify(),60000);
    return () => {stopped=true;window.removeEventListener("focus",handleFocus);window.clearInterval(timer);};
  },[expiresAt,router,pathname]);
  return null;
}
