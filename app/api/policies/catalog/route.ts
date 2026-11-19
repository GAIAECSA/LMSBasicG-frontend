import { NextRequest, NextResponse } from "next/server";
import { studentCatalog } from "@/lib/policies/backend";
import { protectedPolicyRequest, upstreamFailure } from "@/lib/policies/route-guard";

export async function GET(request:NextRequest) {
  const context=await protectedPolicyRequest(request,false);
  if ("response" in context) return context.response;
  try {return NextResponse.json(await studentCatalog(context.token),{headers:{"Cache-Control":"private, no-store"}});}
  catch(error) {return upstreamFailure(error);}
}
