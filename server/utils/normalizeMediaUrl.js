/** שומר ב-DB נתיב יחסי /uploads/... במקום URL מלא — קל יותר להצגה בכל סביבה */
function normalizeUploadPath(urlOrPath) {
  const u = String(urlOrPath || "").trim();
  if (!u) return "";
  if (u.startsWith("/uploads/")) return u;
  if (u.startsWith("uploads/")) return `/${u}`;
  try {
    if (/^https?:\/\//i.test(u)) {
      const { pathname } = new URL(u);
      if (pathname.startsWith("/uploads/")) return pathname;
    }
  } catch {
    /* ignore */
  }
  return u;
}

module.exports = { normalizeUploadPath };
