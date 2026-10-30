import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/config";

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

  if (!bearer) return { response: NextResponse.json({ error: "Bearer token ou X-API-Key obrigatório." }, { status: 401 }) };
  const supabase = createSupabaseClient(env.url, env.key, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(bearer);
  if (error || !data.user) return { response: NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 }) };
  return { supabase, user: data.user };
}
