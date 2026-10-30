"import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/config';

export async function getAssistantContext(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\\s+/i, '');
  if (!token) return { response: NextResponse.json({ error: 'Bearer token obrigatório.' }, { status: 401 }) };
  const env = getSupabaseEnv();
  if (!env) return { response: NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 }) };
  const supabase = createSupabaseClient(env.url, env.key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return { response: NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 401 }) };
  return { supabase, user: data.user };
}
"