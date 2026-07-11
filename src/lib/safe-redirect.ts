/**
 * Returns a safe same-origin relative path for post-auth redirects.
 * Rejects protocol-relative URLs, absolute URLs, and path traversal.
 */
export function getSafeRedirectPath(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw || typeof raw !== "string") return fallback;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  if (trimmed.includes("://") || trimmed.includes("\\")) {
    return fallback;
  }

  try {
    const url = new URL(trimmed, "http://local");
    if (url.hostname !== "local") return fallback;
    const path = url.pathname + url.search + url.hash;
    return path.startsWith("/") ? path : fallback;
  } catch {
    return fallback;
  }
}
