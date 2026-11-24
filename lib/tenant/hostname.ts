/** Dominio original recibido por el proxy (sin protocolo, sin puerto de desarrollo). */
export function normalizeHostname(host: string | null): string | null {
  if (!host) return null;
  const value = host.trim().toLowerCase().replace(/\.$/, "");
  const hostname = value.replace(/:\d+$/, ""); // Quita puerto local; no altera subdominio.
  if (hostname.length > 253 || !/^[a-z0-9.-]+$/.test(hostname) || hostname.includes("..")) return null;
  return hostname;
}

