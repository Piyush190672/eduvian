/**
 * HTML/text escaping helpers for any code that interpolates user-supplied
 * (or DB-stored, or client-body-supplied) values into HTML strings — emails,
 * PDF templates, error pages.
 *
 * Why escape instead of strip:
 * - `O'Brien` → strip-`'` gives `OBrien` (loses data)
 * - `O'Brien` → escape gives `O&#39;Brien` (renders correctly, no injection)
 *
 * The `<>&"'\`` set is the OWASP-recommended minimum for HTML body context.
 * For attribute context (href, src, etc.) prefer URL-encoding via the URL API.
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
  "`": "&#96;",
  "/": "&#x2F;",
};

/** Escape a value for safe interpolation into HTML body or attribute text. */
export function escHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`/]/g, (c) => HTML_ENTITIES[c] ?? c);
}

/**
 * Cap length + escape — handy for free-form fields like name/phone where we
 * also want to limit how much malicious bulk a payload can carry.
 */
export function escHtmlBounded(value: unknown, maxLen: number, fallback = "—"): string {
  if (value === null || value === undefined) return escHtml(fallback);
  const s = String(value);
  if (!s.trim()) return escHtml(fallback);
  return escHtml(s.slice(0, maxLen));
}

/**
 * Attribute-context escape for things like href/src. Returns "" if the URL
 * isn't a safe http(s) or mailto/tel scheme — never surfaces javascript: etc.
 */
export function safeUrl(value: unknown, allowMailto = false): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") return escHtml(u.toString());
    if (allowMailto && (u.protocol === "mailto:" || u.protocol === "tel:")) return escHtml(u.toString());
    return "";
  } catch {
    return "";
  }
}
