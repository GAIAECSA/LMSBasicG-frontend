"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Heartbeat de sesión SIN refresh de token. El SSR/BFF/FastAPI siguen siendo la
 * autoridad para revocación, roles y políticas.
 * Evita verificaciones concurrentes cuando el navegador recupera el foco,
 * al volver desde un selector de archivos o al dispararse el intervalo.
 */
export function SessionMonitor({expiresAt}: {expiresAt:string|null}) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    let stopped = false;
    let busy = false;
    let lastCheck = Date.now(); // El SSR acaba de validar la sesión: no duplicar al montar.
    let controller: AbortController | null = null;
    async function verify() {
      if (stopped || busy || document.visibilityState === "hidden") return;
      const now = Date.now();
      if (now - lastCheck < 45_000) return;
      lastCheck = now;
      busy = true;
      controller = new AbortController();
      try {
        if (expiresAt && now >= Date.parse(expiresAt)) {
          router.replace("/login?expired=1");
          router.refresh();
          return;
        }
        const res = await fetch("/api/auth/session", {cache:"no-store",signal:controller.signal});
        if (stopped) return;
        if (res.status === 401) {
          router.replace("/login?expired=1");
          router.refresh();
          return;
        }
        if (!res.ok) return; // 503, pérdida de red, etc.: no eliminar cookie.
        const data: {status?:string} = await res.json();
        if (data.status === "pending" && pathname !== "/policies") {
          router.replace("/policies"); router.refresh();
        } else if (data.status === "ready" && pathname === "/policies") {
          router.replace("/campus"); router.refresh();
        }
      } catch { /* Error de red o abort: no suponer expiración ni revocación. */ }
      finally { busy = false; controller = null; }
    }
    const handleFocus = () => { void verify(); };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    const timer = window.setInterval(() => void verify(), 60_000);
    return () => {
      stopped = true;
      controller?.abort();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.clearInterval(timer);
    };
  }, [expiresAt, router, pathname]);
  return null;
}
