const FACEBOOK_HOST_PATTERN = /(^|\.)facebook\.com$/i;
const FACEBOOK_PLUGIN_PATH_PATTERN = /^\/plugins\/(post|video)\.php$/i;
const FACEBOOK_SHARE_PATH_PATTERN = /^\/share\//i;

const isFacebookHost = (hostname: string) => FACEBOOK_HOST_PATTERN.test(hostname.toLowerCase());

const normalizeFacebookUrl = (url: URL) => {
  const normalized = new URL(url.toString());
  normalized.protocol = "https:";
  if (normalized.hostname.toLowerCase() === "m.facebook.com") {
    normalized.hostname = "www.facebook.com";
  }
  return normalized;
};

const decodeHref = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const normalizeSourcePostUrl = (rawUrl?: string | null): string | null => {
  const value = (rawUrl ?? "").trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export type FacebookEmbedIssue = {
  code: "share_link";
  message: string;
};

type ResolvedFacebookTarget = {
  targetUrl: URL;
  issue: FacebookEmbedIssue | null;
};

const resolveFacebookTarget = (sourcePostUrl?: string | null): ResolvedFacebookTarget | null => {
  const normalized = normalizeSourcePostUrl(sourcePostUrl);
  if (!normalized) return null;

  const parsed = new URL(normalized);
  if (!isFacebookHost(parsed.hostname)) return null;

  const normalizedUrl = normalizeFacebookUrl(parsed);

  if (FACEBOOK_PLUGIN_PATH_PATTERN.test(normalizedUrl.pathname)) {
    const href = normalizedUrl.searchParams.get("href");
    if (!href) return null;

    const nested = normalizeSourcePostUrl(decodeHref(href));
    if (!nested) return null;
    const nestedUrl = new URL(nested);
    if (!isFacebookHost(nestedUrl.hostname)) return null;

    const normalizedNestedUrl = normalizeFacebookUrl(nestedUrl);
    return {
      targetUrl: normalizedNestedUrl,
      issue: FACEBOOK_SHARE_PATH_PATTERN.test(normalizedNestedUrl.pathname)
        ? {
            code: "share_link",
            message:
              "Facebook share links cannot be embedded reliably. Use the direct post permalink (open post timestamp, then copy link).",
          }
        : null,
    };
  }

  return {
    targetUrl: normalizedUrl,
    issue: FACEBOOK_SHARE_PATH_PATTERN.test(normalizedUrl.pathname)
      ? {
          code: "share_link",
          message:
            "Facebook share links cannot be embedded reliably. Use the direct post permalink (open post timestamp, then copy link).",
        }
      : null,
  };
};

const isVideoPostUrl = (url: URL) => {
  const path = url.pathname.toLowerCase();
  if (path.includes("/reel/")) return true;
  if (path.includes("/videos/")) return true;
  if (path === "/watch" && Boolean(url.searchParams.get("v"))) return true;
  return false;
};

export const getFacebookEmbedIssue = (sourcePostUrl?: string | null): FacebookEmbedIssue | null =>
  resolveFacebookTarget(sourcePostUrl)?.issue ?? null;

export type FacebookEmbedConfig = {
  kind: "post" | "video";
  embedUrl: string;
};

export const toFacebookEmbedConfig = (sourcePostUrl?: string | null, width = 500): FacebookEmbedConfig | null => {
  const resolved = resolveFacebookTarget(sourcePostUrl);
  if (!resolved || resolved.issue) return null;

  const safeWidth = Math.min(750, Math.max(350, Math.round(width)));
  const href = encodeURIComponent(resolved.targetUrl.toString());
  if (isVideoPostUrl(resolved.targetUrl)) {
    return {
      kind: "video",
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${href}&show_text=false&width=${safeWidth}`,
    };
  }

  return {
    kind: "post",
    embedUrl: `https://www.facebook.com/plugins/post.php?href=${href}&show_text=true&width=${safeWidth}`,
  };
};

export const toFacebookPostEmbedUrl = (sourcePostUrl?: string | null, width = 500): string | null =>
  toFacebookEmbedConfig(sourcePostUrl, width)?.embedUrl ?? null;
