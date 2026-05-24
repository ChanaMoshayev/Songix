/** הודעות בעברית לשגיאות Mongoose/MongoDB — במקום טקסט טכני כמו buffering timed out */

const DB_UNAVAILABLE =
  "לא ניתן לטעון נתונים — אין חיבור למסד הנתונים. " +
  "בטרמינל השרת (תיקיית server) ודאי שמופיע «MongoDB connected». " +
  "אם לא: ב-MongoDB Atlas → Network Access → Add Current IP.";

const DB_ATLAS_IP =
  "לא ניתן להתחבר ל-MongoDB Atlas. הוסיפי את כתובת ה-IP שלך ב-Atlas → Network Access → Add Current IP (או 0.0.0.0/0 לפיתוח).";

const DB_DNS =
  "בעיית רשת/DNS בחיבור ל-MongoDB. נסי שינוי DNS ל-8.8.8.8 או מחרוזת חיבור mongodb:// (לא +srv) מ-Atlas.";

function toUserFacingDbMessage(err) {
  const msg = String(err?.message || err || "");

  if (
    msg.includes("buffering timed out") ||
    msg.includes("before initial connection is complete") ||
    msg.includes("Client must be connected")
  ) {
    return DB_UNAVAILABLE;
  }
  if (msg.toLowerCase().includes("whitelist") || msg.includes("ServerSelection")) {
    return DB_ATLAS_IP;
  }
  if (msg.includes("querySrv") || msg.includes("ECONNREFUSED")) {
    return DB_DNS;
  }
  if (msg.includes("TLS") || msg.includes("SSL")) {
    return DB_ATLAS_IP;
  }

  return null;
}

function resolveErrorMessage(err, fallback = "שגיאת שרת") {
  return toUserFacingDbMessage(err) || err?.message || fallback;
}

module.exports = {
  DB_UNAVAILABLE,
  toUserFacingDbMessage,
  resolveErrorMessage,
};
