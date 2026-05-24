import { apiOrigin } from "./apiBase.js";

/** ממיר songUrl / coverImageUrl לכתובת מלאה לדפדפן */
export function resolveUploadUrl(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) {
    try {
      const { pathname } = new URL(u);
      if (pathname.startsWith("/uploads/")) {
        const origin = apiOrigin().replace(/\/$/, "");
        return `${origin}${pathname}`;
      }
    } catch {
      /* keep full URL */
    }
    return u;
  }
  const origin = apiOrigin().replace(/\/$/, "");
  return `${origin}${u.startsWith("/") ? u : `/${u}`}`;
}
