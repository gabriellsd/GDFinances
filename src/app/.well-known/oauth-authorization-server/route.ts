import { NextResponse } from "next/server";
import { oauthIssuer, mcpResource, OAUTH_SUPPORTED_SCOPES } from "@/lib/oauth-server";
export const dynamic = "force-dynamic";
export async function GET() {
  const issuer = oauthIssuer();
  return NextResponse.json({
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    revocation_endpoint: `${issuer}/oauth/revoke`,
    jwks_uri: `${issuer}/.well-known/jwks.json`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [...OAUTH_SUPPORTED_SCOPES],
    authorization_response_iss_parameter_supported: true,
    client_id_metadata_document_supported: false,
    resource: mcpResource(),
  }, { headers: { "Cache-Control": "public, max-age=300", "Access-Control-Allow-Origin": "*" } });
}