import { NextResponse } from "next/server";

/** Healthcheck de la instancia; no comprueba la BD ni valida un dominio de academia. */
export function GET() {
  return NextResponse.json({ status: "ok", service: "athena-frontend" }, { headers: { "Cache-Control": "no-store" } });
}
