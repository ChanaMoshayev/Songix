const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowed = [".jpg", ".jpeg", ".jpe", ".jfif", ".png", ".webp", ".gif", ".bmp", ".heic", ".heif", ".tif", ".tiff"];
    const extFinal = allowed.includes(ext) ? ext : ".jpg";
    const base = path.basename(file.originalname || "cover", ext).replace(/[^\w.-]/g, "_").slice(0, 60);
    cb(null, `cover-${Date.now()}-${base || "img"}${extFinal}`);
  },
});

const IMAGE_EXT = /\.(jpe?g|jfif|png|webp|gif|bmp|heic|heif|tiff?)$/i;

function fileFilter(_req, file, cb) {
  const name = String(file.originalname || "");
  const mime = String(file.mimetype || "").toLowerCase();
  const imageMime = mime.startsWith("image/");
  const imageExt = IMAGE_EXT.test(name);
  const octetWithExt =
    (mime === "application/octet-stream" || mime === "") && imageExt;
  if (imageMime || imageExt || octetWithExt) cb(null, true);
  else {
    cb(
      new Error(
        "קובץ לא נתמך — העלו תמונה (JPG, PNG, WebP, GIF, BMP, HEIC וכו')."
      )
    );
  }
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});
