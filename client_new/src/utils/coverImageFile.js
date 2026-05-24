/** סיוע לבחירת תמונת שער — כולל קבצים מהורדות ב-Windows (BMP, JFIF, HEIC וכו') */

const COVER_EXT = /\.(jpe?g|jfif|png|webp|gif|bmp|heic|heif|tiff?)$/i;

/** ערך ל-input accept — רחב יותר מ-MIME בלבד כדי שהדיאלוג יציג קבצים מהורדות */
export const COVER_FILE_ACCEPT =
  "image/*,.jpg,.jpeg,.jpe,.jfif,.png,.webp,.gif,.bmp,.heic,.heif,.tiff,.tif";

export function isAllowedCoverImageFile(file) {
  if (!file) return false;
  const mime = String(file.type || "").toLowerCase();
  const name = String(file.name || "");
  if (mime.startsWith("image/")) return true;
  if (COVER_EXT.test(name)) return true;
  // Windows לעיתים שולח application/octet-stream לתמונות מהורדות
  if ((mime === "" || mime === "application/octet-stream") && COVER_EXT.test(name)) return true;
  return false;
}

export function coverFileRejectMessage(file) {
  const name = file?.name ? `«${file.name}»` : "הקובץ";
  return (
    `${name} לא נתמך. בחרי תמונה בפורמט JPG, PNG, WebP, GIF, BMP או HEIC — ` +
    "או המרי את הקובץ ל-JPG (לחיצה ימנית → פתיחה בצייר / שמירה בשם)."
  );
}
