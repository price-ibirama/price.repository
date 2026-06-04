function isLocalSupabaseUrl(url: string | undefined) {
  return (
    url?.startsWith("http://127.0.0.1") ||
    url?.startsWith("http://localhost") ||
    url?.startsWith("https://127.0.0.1") ||
    url?.startsWith("https://localhost")
  );
}

export function isLocalDevelopment() {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;

  return process.env.NODE_ENV === "development" && isLocalSupabaseUrl(supabaseUrl);
}
