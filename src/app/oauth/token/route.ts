import { NextRequest, NextResponse } from "next/server";
import { oauthAdmin, hashToken, issueAccessToken, randomToken, REFRESH_TOKEN_TTL, mcpResource } from "@/lib/oauth-server";
import { createHash, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

function verifyPkce(verifier: string, challenge: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  const digest = createHash("sha256").update(verifier).digest("base64url");
  const a = Buffer.from(digest), b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  let stage = "parse_form";
  let grant = "unknown";

  const reject = (error: string, status = 400, reason: string) => {
    // Never log authorization codes, access/refresh tokens, client IDs, user IDs, or form values.
    console.warn("OAuth token request rejected", {
      stage,
      reason,
      grant,
      hasClientId: false,
    });
    return NextResponse.json({ error }, {
      status,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  };

  try {
    const form = await request.formData();
    grant = String(form.get("grant_type") || "unknown");
    const clientId = String(form.get("client_id") || "");
    const resource = String(form.get("resource") || "");

    stage = "validate_client_and_resource";
    if (!clientId) return reject("invalid_request", 400, "missing_client_id");
    if (resource !== mcpResource()) return reject("invalid_request", 400, "resource_mismatch");

    stage = "load_oauth_client";
    const admin = oauthAdmin();
    const { data: client, error: clientError } = await admin
      .from("oauth_clients")
      .select("client_id,redirect_uris")
      .eq("client_id", clientId)
      .is("disabled_at", null)
      .maybeSingle();
    if (clientError) {
      console.error("OAuth token client lookup failed", { code: clientError.code || "unknown" });
      return reject("server_error", 500, "client_lookup_database_error");
    }
    if (!client) return reject("invalid_client", 401, "client_not_registered_or_disabled");

    if (grant === "authorization_code") {
      stage = "validate_authorization_code_request";
      const code = String(form.get("code") || "");
      const verifier = String(form.get("code_verifier") || "");
      const redirectUri = String(form.get("redirect_uri") || "");
      if (!code) return reject("invalid_grant", 400, "missing_authorization_code");
      if (!verifier) return reject("invalid_grant", 400, "missing_code_verifier");
      if (!redirectUri) return reject("invalid_grant", 400, "missing_redirect_uri");
      if (!client.redirect_uris.includes(redirectUri)) return reject("invalid_grant", 400, "redirect_uri_mismatch");

      stage = "lookup_authorization_code";
      const { data: row, error: codeError } = await admin
        .from("oauth_authorization_codes")
        .select("*")
        .eq("code_hash", hashToken(code))
        .eq("client_id", clientId)
        .eq("redirect_uri", redirectUri)
        .eq("resource", resource)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (codeError) {
        console.error("OAuth authorization code lookup failed", { code: codeError.code || "unknown" });
        return reject("server_error", 500, "authorization_code_database_error");
      }
      if (!row) return reject("invalid_grant", 400, "authorization_code_not_found_expired_used_or_mismatched");
      if (!verifyPkce(verifier, row.code_challenge)) return reject("invalid_grant", 400, "pkce_verification_failed");

      stage = "consume_authorization_code";
      const { data: consumed, error: consumeError } = await admin
        .from("oauth_authorization_codes")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", row.id)
        .is("consumed_at", null)
        .select("id")
        .maybeSingle();
      if (consumeError) {
        console.error("OAuth authorization code consumption failed", { code: consumeError.code || "unknown" });
        return reject("server_error", 500, "authorization_code_consume_database_error");
      }
      if (!consumed) return reject("invalid_grant", 400, "authorization_code_already_consumed");

      stage = "verify_consent";
      const { data: consent, error: consentError } = await admin
        .from("oauth_consents")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("client_id", clientId)
        .is("revoked_at", null)
        .maybeSingle();
      if (consentError) {
        console.error("OAuth consent lookup failed", { code: consentError.code || "unknown" });
        return reject("server_error", 500, "consent_database_error");
      }
      if (!consent) return reject("invalid_grant", 400, "active_consent_not_found");

      stage = "store_refresh_token";
      const refresh = randomToken(48);
      const { error: refreshError } = await admin.from("oauth_refresh_tokens").insert({
        token_hash: hashToken(refresh),
        family_id: crypto.randomUUID(),
        user_id: row.user_id,
        client_id: clientId,
        scope: row.scope,
        resource,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
      });
      if (refreshError) {
        console.error("OAuth refresh token insert failed", { code: refreshError.code || "unknown" });
        return reject("server_error", 500, "refresh_token_database_error");
      }

      stage = "issue_access_token";
      const accessToken = issueAccessToken({ userId: row.user_id, clientId, scope: row.scope, resource });
      console.info("OAuth authorization_code exchange succeeded", { grant, scope: row.scope, accessTokenTtlSeconds: 600 });
      return NextResponse.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 600,
        refresh_token: refresh,
        scope: row.scope,
      }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }

    if (grant === "refresh_token") {
      stage = "validate_refresh_token";
      const refresh = String(form.get("refresh_token") || "");
      if (!refresh) return reject("invalid_grant", 400, "missing_refresh_token");

      stage = "rotate_refresh_token";
      const next = randomToken(48);
      const { data, error } = await admin.rpc("rotate_oauth_refresh_token", {
        p_old_hash: hashToken(refresh),
        p_new_hash: hashToken(next),
        p_new_expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString(),
        p_client_id: clientId,
        p_resource: resource,
      });
      if (error) {
        console.error("OAuth refresh token rotation failed", { code: error.code || "unknown" });
        return reject("server_error", 500, "refresh_rotation_database_error");
      }
      const rotated = Array.isArray(data) ? data[0] : data;
      if (!rotated) return reject("invalid_grant", 400, "refresh_token_not_found");
      if (rotated.status !== "rotated") return reject("invalid_grant", 400, "refresh_token_expired_revoked_or_replayed");
      if (rotated.client_id !== clientId) return reject("invalid_grant", 400, "refresh_client_mismatch");
      if (rotated.resource !== resource) return reject("invalid_grant", 400, "refresh_resource_mismatch");

      stage = "issue_refreshed_access_token";
      const accessToken = issueAccessToken({
        userId: rotated.user_id,
        clientId,
        scope: rotated.token_scope,
        resource,
      });
      console.info("OAuth refresh_token exchange succeeded", {
        grant,
        scope: rotated.token_scope,
        accessTokenTtlSeconds: 600,
      });
      return NextResponse.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 600,
        refresh_token: next,
        scope: rotated.token_scope,
      }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
    }

    return reject("unsupported_grant_type", 400, "unsupported_grant_type");
  } catch (error) {
    console.error("OAuth token endpoint unexpected failure", {
      stage,
      grant,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message.slice(0, 200) : "Unknown error",
    });
    return NextResponse.json({ error: "server_error" }, {
      status: 500,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  }
}
