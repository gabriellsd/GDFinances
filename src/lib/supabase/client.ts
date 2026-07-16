import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/supabase/config";

export function createClient() {
  const env = getSupabaseEnv();

  if (!env) {
    throw new Error(
      "Supabase não configurado. Preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local — veja docs/SUPABASE.md"
    );
  }

  return createBrowserClient(env.url, env.key);
}
