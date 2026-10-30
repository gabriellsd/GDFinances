import { NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const env = getSupabaseEnv();
  const resource = new URL(request.url).origin + "/api/assistant/mcp";
  const issuer = env ? env.url.replace(/\/$/, "") + "/auth/v1" : "";
  return NextResponse.json({ resource, authorization_servers: issuer ? [issuer] : [], bearer_methods_supported: ["header"] }, { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type" } });
}