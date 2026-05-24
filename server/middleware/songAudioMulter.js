const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const allowed = [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".webm", ".flac"];
    const extFinal = allowed.includes(ext) ? ext : ".mp3";
    const base = path.basename(file.originalname || "track", ext).replace(/[^\w.-]/g, "_").slice(0, 80);
    cb(null, `${Date.now()}-${base || "track"}${extFinal}`);
  },
});

function fileFilter(_req, file, cb) {
  const name = String(file.originalname || "");
  const mime = String(file.mimetype || "");
  const audioMime = mime.startsWith("audio/");
  const audioExt = /\.(mp3|wav|ogg|m4a|aac|webm|flac)$/i.test(name);
  if (audioMime || audioExt) cb(null, true);
  else cb(new Error("קובץ לא נתמך — העלו קובץ אודיו (למשל MP3)."));
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 35 * 1024 * 1024 },
});
