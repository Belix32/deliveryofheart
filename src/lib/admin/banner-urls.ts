const BLOCKED_PROTOCOL = /^(javascript|data|vbscript):/i;

/** Относительный путь на том же сайте, без protocol-relative `//`. */
export function isSafeRelativePath(url: string): boolean {
  return /^\/(?!\/)/.test(url);
}

function getSupabaseHostname(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

const ALLOWED_IMAGE_HOSTS = new Set(["images.unsplash.com"]);

export function isValidBannerImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || BLOCKED_PROTOCOL.test(trimmed)) return false;
  if (isSafeRelativePath(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;

    const supabaseHost = getSupabaseHostname();
    if (supabaseHost && parsed.hostname === supabaseHost) {
      return parsed.pathname.startsWith("/storage/v1/object/public/");
    }

    return ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function getAllowedLinkHosts(): Set<string> {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate?.trim()) continue;
    try {
      hosts.add(new URL(candidate).hostname);
    } catch {
      // ignore invalid env
    }
  }

  return hosts;
}

export function isValidBannerLinkUrl(url: string | null | undefined): boolean {
  if (url == null || url === "") return true;

  const trimmed = url.trim();
  if (BLOCKED_PROTOCOL.test(trimmed)) return false;
  if (isSafeRelativePath(trimmed)) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") return false;
    return getAllowedLinkHosts().has(parsed.hostname);
  } catch {
    return false;
  }
}

export function isExternalBannerLink(url: string): boolean {
  return !isSafeRelativePath(url) && url.startsWith("http");
}
