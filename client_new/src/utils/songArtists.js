import { displaySongArtist } from "./deriveArtistFromSongUrl.js";

/** מפצל «אבי אילסון ואיציק דדיה» לשני זמרים נפרדים */
export function parseArtistNames(raw) {
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

/** כל שמות הזמרים של שיר */
export function getArtistNamesForSong(song) {
  return parseArtistNames(displaySongArtist(song));
}

/** האם השיר שייך לזמר (גם בשיר משותף) */
export function songFeaturesArtist(song, artistName) {
  const target = String(artistName || "").trim().toLowerCase();
  if (!target) return false;
  return getArtistNamesForSong(song).some(n => n.toLowerCase() === target);
}

/** אותיות לתצוגה באווטאר */
export function artistInitials(name) {
  const t = String(name || "").trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] || "";
    const b = parts[1][0] || "";
    return `${a}${b}`.toUpperCase();
  }
  return Array.from(t).slice(0, 2).join("");
}

/** צבע יציב לפי שם אמן */
export function artistAccentHue(name) {
  const s = String(name || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = s.charCodeAt(i) + ((h << 5) - h);
  }
  const hues = [212, 248, 280, 326, 12, 38, 158, 186, 220];
  return hues[Math.abs(h) % hues.length];
}

/**
 * רשימת זמרים ייחודיים מהשירים — אחד לכל שם, לא שורה משותפת ל-duet
 */
export function getArtistsFromSongs(songs) {
  if (!Array.isArray(songs)) return [];
  const map = new Map();

  for (const song of songs) {
    const names = getArtistNamesForSong(song);
    for (const name of names) {
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name, songCount: 0, coverImageUrl: "" });
      }
      const entry = map.get(key);
      entry.songCount += 1;
      if (!entry.coverImageUrl && song.coverImageUrl) {
        entry.coverImageUrl = String(song.coverImageUrl);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "he"));
}
