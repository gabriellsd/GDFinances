function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfigured() {
  const env = getSupabaseEnv();
  return env !== null;
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  // Evita crash no middleware se alguém colar a chave no campo da URL
  if (!isValidHttpUrl(url)) {
    console.warn(
      "[GDFinances] NEXT_PUBLIC_SUPABASE_URL inválida. Use https://SEU_PROJETO.supabase.co (Settings → API → Project URL)."
    );
    return null;
  }

  return { url, key };
}
