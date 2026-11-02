import { NextResponse } from "next/server";
import { mcpResource, oauthIssuer } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json({
      resource: mcpResource(),
      authorization_servers: [oauthIssuer()],
      bearer_methods_supported: ["header"],
      scopes_supported: ["finance:read"],
    }, { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
  } catch {
    return NextResponse.json({ error: "OAuth não configurado." }, { status: 503 });
  }
}
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type" } });
}