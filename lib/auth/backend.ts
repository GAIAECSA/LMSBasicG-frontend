import { backendBaseUrl } from "@/lib/backend/config";

/** BFF: el JWT nunca sale en las respuestas al navegador ni se almacena en localStorage. */
export async function apiFetch(path: string, token: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}

/** Decodificación NO confiable usada solo para DESCARTAR tokens de otro tenant o vencidos.
 * La autorización siempre exige una llamada posterior a FastAPI que comprueba firma, jti y revocación. */
export function jwtTenantAndExpiry(token: string): {businessId: number; expiresAt: string | null} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    const businessId = Number(payload.business_id);
    if (!Number.isSafeInteger(businessId) || businessId <= 0 || payload.type !== "access" ||
        typeof payload.exp !== "number" || payload.exp <= Date.now() / 1000) return null;
    return {businessId, expiresAt: new Date(payload.exp * 1000).toISOString()};
  } catch { return null; }
}

