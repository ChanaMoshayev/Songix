const fs = require("fs");
const path = require("path");

/** שומר data URL של אודיו לתיקיית uploads; מחזיר נתיב /uploads/... */
function saveDataUrlAudio(dataUrl) {
  const raw = String(dataUrl || "").trim();
  const match = /^data:([^;]+);base64,(.+)$/i.exec(raw);
  if (!match) return null;
  const mime = match[1].toLowerCase();
  let ext = ".webm";
  if (mime.includes("mpeg") || mime.includes("mp3")) ext = ".mp3";
  else if (mime.includes("wav")) ext = ".wav";
  else if (mime.includes("ogg")) ext = ".ogg";
  else if (mime.includes("mp4") || mime.includes("m4a")) ext = ".m4a";

  const buf = Buffer.from(match[2], "base64");
  const dir = path.join(__dirname, "..", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  const filename = `contest-melody-${Date.now()}${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  return `/uploads/${filename}`;
}

module.exports = { saveDataUrlAudio };
