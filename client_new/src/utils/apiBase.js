/** מקור ה-API — בפיתוח דרך proxy של Vite (אותו פורט כמו האתר) */
export function apiOrigin() {
  const b = import.meta.env.VITE_API_URL?.trim();
  if (b) return b.replace(/\/$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  return "http://localhost:5000";
}

function uploadErrorFromResponse(res, data, text) {
  if (data && typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (typeof text === "string" && text.includes("Cannot POST")) {
    return "השרת לא מכיר העלאת תמונות — עצרי והפעילי מחדש את שרת Node מתיקיית server (npm run dev).";
  }
  if (typeof text === "string" && text.includes("<!DOCTYPE")) {
    return `שגיאת שרת (${res.status}). ודאי שהשרת רץ עם הקוד העדכני על פורט 5000.`;
  }
  return `שגיאה (${res.status})`;
}

/** מעלה תמונת שער לשרת; מחזיר { ok, coverImageUrl?, message? } */
export async function uploadSongCoverFile(file) {
  if (!file) return { ok: false, message: "לא נבחר קובץ." };
  const fd = new FormData();
  fd.append("cover", file);
  try {
    const res = await fetch(`${apiOrigin()}/songs/upload-cover`, {
      method: "POST",
      body: fd,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { _raw: text };
    }
    if (!res.ok) {
      return { ok: false, message: uploadErrorFromResponse(res, data, text) };
    }
    if (typeof data?.coverImageUrl === "string" && data.coverImageUrl.trim()) {
      return { ok: true, coverImageUrl: data.coverImageUrl.trim() };
    }
    return { ok: false, message: "תשובת שרת לא צפויה." };
  } catch {
    return { ok: false, message: "לא ניתן להתחבר לשרת." };
  }
}

/** מעלה קובץ אודיו לשרת; מחזיר { ok, songUrl?, message? } */
export async function uploadSongAudioFile(file) {
  if (!file) return { ok: false, message: "לא נבחר קובץ." };
  const fd = new FormData();
  fd.append("audio", file);
  try {
    const res = await fetch(`${apiOrigin()}/songs/upload-audio`, {
      method: "POST",
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: typeof data?.message === "string" ? data.message : `שגיאה (${res.status})` };
    }
    if (typeof data?.songUrl === "string" && data.songUrl.trim()) {
      return { ok: true, songUrl: data.songUrl.trim() };
    }
    return { ok: false, message: "תשובת שרת לא צפויה." };
  } catch {
    return { ok: false, message: "לא ניתן להתחבר לשרת." };
  }
}

/** בלי VITE_API_URL — נתיבים יחסיים (בפיתוח: Vite מפנה לשרת). עם משתנה — כתובת מלאה לפרודקשן */
export function apiPath(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = import.meta.env.VITE_API_URL?.trim();
  if (base) return `${base.replace(/\/$/, "")}${p}`;
  return p;
}

/** קורא גוף תשובה כ-JSON; אם זה HTML (למשל 404 של Express) מחזיר _text */
export async function fetchJson(url, options) {
  const res = await fetch(apiPath(url), options);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { _nonJson: true, _text: text.slice(0, 400) };
  }
  return { res, data };
}

/** גיבוי בצד לקוח אם השרת החזיר טקסט טכני ישן */
export function friendlyApiMessage(raw) {
  const msg = String(raw || "").trim();
  if (!msg) return "";
  if (msg.includes("buffering timed out") || msg.includes("before initial connection")) {
    return (
      "לא ניתן לטעון שירים — אין חיבור למסד הנתונים. " +
      "ודאי שהשרת רץ עם «MongoDB connected» וב-Atlas הוספת את ה-IP שלך."
    );
  }
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "לא ניתן להתחבר לשרת. ודאי שהשרת רץ על פורט 5000 (תיקיית server).";
  }
  return msg;
}

/** מפרק תשובת GET /songs — מונע הצגת JSON גולמי כשהשרת מחזיר HTML או טקסט שבור */
export async function fetchSongsList(abortSignal) {
  const res = await fetch(`${apiOrigin()}/songs`, abortSignal ? { signal: abortSignal } : undefined);
  const text = await res.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("<!") || trimmed.startsWith("<html")) {
    throw new Error("קיבלנו דף HTML במקום נתוני שירים — רענני דרך localhost:5173 (לא פורט 5000).");
  }

  let data;
  try {
    data = trimmed ? JSON.parse(trimmed) : [];
  } catch {
    throw new Error("תשובת שרת לא תקינה — לא ניתן לקרוא את רשימת השירים.");
  }

  if (!res.ok) {
    throw new Error(formatFetchError(res, data));
  }

  if (!Array.isArray(data)) {
    throw new Error("תשובת שרת לא תקינה — צפויה רשימת שירים.");
  }

  return data;
}

/** מוביל לראש עמוד השירים — רק מתחרות */
export async function fetchSongsPageFeatured() {
  const res = await fetch(`${apiOrigin()}/songs/featured`);
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("שגיאה בטעינת מוביל");
  }
  if (!res.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "שגיאה בטעינת מוביל");
  }
  return data;
}

/** מדווח השמעה אחת (לא חוסם את הנגן אם נכשל) */
export function recordSongPlay(songId) {
  const id = String(songId || "").trim();
  if (!id) return;
  fetch(`${apiOrigin()}/songs/${encodeURIComponent(id)}/play`, { method: "POST" }).catch(() => {});
}

export function formatFetchError(res, data) {
  if (data && typeof data.message === "string" && data.message.trim()) {
    return friendlyApiMessage(data.message.trim());
  }
  if (data?._nonJson && typeof data._text === "string") {
    const t = data._text;
    if (t.includes("Cannot GET") || t.includes("Cannot POST")) {
      return "השרת לא מכיר את הבקשה — הפעילי מחדש את שרת ה-Node מתיקיית server (עם הקוד העדכני).";
    }
    if (t.trimStart().startsWith("[") || t.trimStart().startsWith("{")) {
      return "התקבלה תשובת JSON במקום דף האתר — רענני דרך localhost:5173.";
    }
    return t.slice(0, 200);
  }
  return `שגיאת שרת (${res.status}).`;
}
