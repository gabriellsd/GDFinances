import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { mcpResource, verifyAccessToken } from "@/lib/oauth-server";

export async function getAssistantContext(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const bearer = authorization?.match(/^Bearer\\s+(.+)$/i)?.[1];
  const apiKey = request.headers.get("x-api-key") || (bearer?.startsWith("gdf_") ? bearer : null);
  const env = getSupabaseEnv();
  if (!env) return { response: NextResponse.json({ error: "Supabase não configurado." }, { status: 503 }) };

  if (apiKey) {
    const keyHash = createHash("sha256").update(apiKey).digest("hex");
    const supabase = createSupabaseClient(env.url, env.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: userId, error } = await supabase.rpc("verify_assistant_api_key", { p_key_hash: keyHash });
    if (error || !userId) return { response: NextResponse.json({ error: "Chave de API inválida ou revogada." }, { status: 401 }) };
    return { supabase, user: { id: userId } };
  }

  if (!bearer) return { response: NextResponse.json({ error: "Bearer token obrigatório." }, { status: 401 }) };

  // OAuth access tokens are audience-bound to this MCP resource and carry finance:read only.
  if (bearer.split(".").length === 3) {
    const claims = verifyAccessToken(bearer, mcpResource());
    if (claims) {
      const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRole) return { response: NextResponse.json({ error: "OAuth não configurado no servidor." }, { status: 503 }) };
      const supabase = createSupabaseClient(env.url, serviceRole, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      return { supabase, user: { id: claims.sub }, oauth: true };
    }
  }

  const supabase = createSupabaseClient(env.url, env.key, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(bearer);
  if (error || !data.user) return { response: NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 }) };
  return { supabase, user: data.user };
}
