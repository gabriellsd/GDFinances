import { NextRequest, NextResponse } from "next/server";
import { oauthAdmin, randomToken, isSafeRedirectUri, OAUTH_SUPPORTED_SCOPES } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = typeof body.client_name === "string" ? body.client_name.trim().slice(0, 120) : "";
    const redirects = Array.isArray(body.redirect_uris) ? body.redirect_uris : [];
    if (!name || redirects.length < 1 || redirects.length > 20 || !redirects.every((uri: unknown) => typeof uri === "string" && uri.length <= 2048 && isSafeRedirectUri(uri))) return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
    if (body.token_endpoint_auth_method && body.token_endpoint_auth_method !== "none") return NextResponse.json({ error: "invalid_client_metadata" }, { status: 400 });
    const clientId = `gdf_client_${randomToken(24)}`;
    const { error } = await oauthAdmin().from("oauth_clients").insert({ client_id: clientId, client_name: name, client_uri: typeof body.client_uri === "string" ? body.client_uri : null, redirect_uris: redirects, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", scope: OAUTH_SUPPORTED_SCOPES.join(" "), client_metadata: { registration_source: "dynamic" } });
    if (error) throw error;
    return NextResponse.json({ client_id: clientId, client_name: name, redirect_uris: redirects, grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none", scope: OAUTH_SUPPORTED_SCOPES.join(" ") }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ error: "server_error" }, { status: 500 }); }
}