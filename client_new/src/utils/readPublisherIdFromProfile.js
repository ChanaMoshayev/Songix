/**
 * מזהה משתמש לשמירה ב־publisherId — תומך ב־userId מ־localStorage אחרי JSON.parse
 * (למשל מחרוזת ObjectId, או במקרה נדיר אובייקט עם $oid).
 */
export function readPublisherObjectIdFromProfile(profile) {
  if (!profile || typeof profile !== "object") return "";
  const raw = profile.userId ?? profile._id;
  if (raw == null) return "";
  if (typeof raw === "string" || typeof raw === "number") return String(raw).trim();
  if (typeof raw === "object") {
    if (typeof raw.$oid === "string") return raw.$oid.trim();
    if (raw._id != null) return String(raw._id).trim();
  }
  return String(raw).trim();
}
