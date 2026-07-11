export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url) return url;

  if (allowPlaceholderEnv()) {
    return "https://placeholder.supabase.co";
  }

  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (key) return key;

  if (allowPlaceholderEnv()) {
    return "placeholder-anon-key";
  }

  throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)");
}

function allowPlaceholderEnv(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST === "true" ||
    process.env.CI === "true"
  );
}
