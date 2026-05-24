/**
 * מפצל שדה אמן לרשימת זמרים — למשל «אבי אילסון ואיציק דדיה» → שני שמות
 */
function parseArtistNames(raw) {
  const text = String(raw || "").trim();
  if (!text || text === "אמן לא ידוע") return [];

  const parts = text
    .split(
      /\s+ו\s+|\s+ו(?=[\u0590-\u05FF])|\s+and\s+|\s*&\s*|,|\s*\/\s*|\s+feat\.?\s+|\s+ft\.?\s+|\s+עם\s+/gi
    )
    .map(s => s.trim())
    .filter(Boolean);

  if (parts.length <= 1) return [text];

  const seen = new Set();
  const out = [];
  for (const name of parts) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** האם שיר שייך לזמר (כולל duet) */
function songFeaturesArtist(song, artistName) {
  const target = String(artistName || "").trim().toLowerCase();
  if (!target) return false;

  const fromDb = String(song?.artist || "").trim();
  let combined = fromDb;
  if (!combined) {
    const { deriveArtistFromSongUrl } = require("./deriveArtistFromSongUrl");
    combined = deriveArtistFromSongUrl(song?.songUrl) || "";
  }
  const names = parseArtistNames(combined);
  return names.some(n => n.toLowerCase() === target);
}

module.exports = { parseArtistNames, songFeaturesArtist };
