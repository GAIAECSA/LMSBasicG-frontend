import { NextRequest } from "next/server";
import { backendBaseUrl } from "@/lib/backend/config";

export const SESSION_COOKIE = "athena_lms_session";

export function sameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try { return new URL(origin).host.toLowerCase() === host.toLowerCase(); }
  catch { return false; }
}

export async function authenticatedUser(token: string): Promise<{ business_id: number; id: number; firstname: string; lastname: string; username: string; role?: { name?: string } } | null> {
  try {
    const response = await fetch(`${backendBaseUrl()}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    if (!Number.isInteger(payload.business_id) || !Number.isInteger(payload.id)) return null;
    return payload;
  } catch { return null; }
}
