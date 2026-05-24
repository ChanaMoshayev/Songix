/**
 * שם אמן מה־songUrl: לפני הסלאש הראשון (בנתיב הלוגי) = אמן, אחרי הסלאש = שם השיר מהקישור.
 * ל־URL מלא: pathname אחרי uploads/ ואז פיצול לפי '/' הראשון.
 * אם אין סלאש — מנסים מקף ראשון בשם הקובץ (Artist-Title.mp3).
 * decodeURIComponent לעולם לא זורק — URIError נבלע.
 */
function safeDecode(s) {
  try {
    return decodeURIComponent(String(s || ""));
  } catch {
    return String(s || "");
  }
}

function parseArtistAndTitleFromSongUrl(songUrl) {
  const raw = String(songUrl || "").trim();
  if (!raw) return { artist: "", titleFromUrl: "" };

  const noQ = raw.split("?")[0].split("#")[0];

  function stripExt(name) {
    return String(name || "").replace(/\.[^/.]+$/, "");
  }

  if (!/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(noQ)) {
    const i = noQ.indexOf("/");
    if (i > 0) {
      const artist = safeDecode(noQ.slice(0, i).trim().replace(/\+/g, " "));
      const rest = safeDecode(noQ.slice(i + 1).trim().replace(/\+/g, " "));
      return { artist, titleFromUrl: stripExt(rest) };
    }
    return { artist: "", titleFromUrl: stripExt(noQ) };
  }

  try {
    const u = new URL(noQ);
    let path = safeDecode(u.pathname || "");
    path = path.replace(/^\/+/, "");
    if (/^uploads\//i.test(path)) path = path.replace(/^uploads\//i, "");

    const idx = path.indexOf("/");
    if (idx > 0) {
      const artist = path.slice(0, idx).trim().replace(/\+/g, " ");
      const rest = path.slice(idx + 1).trim().replace(/\+/g, " ");
      return { artist: safeDecode(artist), titleFromUrl: stripExt(safeDecode(rest)) };
    }

    const last = path.split("/").filter(Boolean).pop() || path;
    const base = stripExt(last);
    const d = base.indexOf("-");
    if (d > 0 && d < base.length - 1) {
      return { artist: base.slice(0, d).trim(), titleFromUrl: base.slice(d + 1).trim() };
    }
    return { artist: "", titleFromUrl: base };
  } catch {
    const i = noQ.indexOf("/");
    if (i > 0) {
      return {
        artist: noQ.slice(0, i).trim(),
        titleFromUrl: stripExt(noQ.slice(i + 1).trim()),
      };
    }
    return { artist: "", titleFromUrl: "" };
  }
}

function deriveArtistFromSongUrl(songUrl) {
  try {
    return parseArtistAndTitleFromSongUrl(songUrl).artist || "";
  } catch {
    return "";
  }
}

module.exports = { deriveArtistFromSongUrl, parseArtistAndTitleFromSongUrl };
