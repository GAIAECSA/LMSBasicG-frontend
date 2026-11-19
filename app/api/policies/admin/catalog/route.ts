import { NextRequest, NextResponse } from "next/server";
import { adminCatalog } from "@/lib/policies/backend";
import { protectedPolicyRequest, upstreamFailure } from "@/lib/policies/route-guard";

export async function GET(request:NextRequest) {
  const context=await protectedPolicyRequest(request,true);
  if ("response" in context) return context.response;
  try {
    return NextResponse.json({policies:await adminCatalog(context.token)},{headers:{"Cache-Control":"private, no-store"}});
  } catch(error) {return upstreamFailure(error);}
}
