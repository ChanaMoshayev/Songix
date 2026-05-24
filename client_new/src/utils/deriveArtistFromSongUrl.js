/**
 * שם אמן מה־songUrl — תואם לשרת (server/utils/deriveArtistFromSongUrl.js)
 */
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
      const artist = decodeURIComponent(noQ.slice(0, i).trim().replace(/\+/g, " "));
      const rest = decodeURIComponent(noQ.slice(i + 1).trim().replace(/\+/g, " "));
      return { artist, titleFromUrl: stripExt(rest) };
    }
    return { artist: "", titleFromUrl: stripExt(noQ) };
  }

  try {
    const u = new URL(noQ);
    let path = decodeURIComponent(u.pathname || "");
    path = path.replace(/^\/+/, "");
    if (/^uploads\//i.test(path)) path = path.replace(/^uploads\//i, "");

    const idx = path.indexOf("/");
    if (idx > 0) {
      const artist = path.slice(0, idx).trim().replace(/\+/g, " ");
      const rest = path.slice(idx + 1).trim().replace(/\+/g, " ");
      return { artist: decodeURIComponent(artist), titleFromUrl: stripExt(decodeURIComponent(rest)) };
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

export function deriveArtistFromSongUrl(songUrl) {
  return parseArtistAndTitleFromSongUrl(songUrl).artist || "";
}

/** תצוגה: מהמסד או נגזר מה־URL (לשירים ישנים) */
export function displaySongArtist(song) {
  const fromDb = String(song?.artist || "").trim();
  if (fromDb) return fromDb;
  return deriveArtistFromSongUrl(song?.songUrl) || "אמן לא ידוע";
}
