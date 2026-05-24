import { apiOrigin } from "./apiBase.js";

/** זמרים לפס — רק רשומות מטבלת הזמרים במסד (שמירת מנהל + תמונה) */
export async function fetchArtistsForStrip() {
  const res = await fetch(`${apiOrigin()}/artists?stripOnly=1`);
  const text = await res.text();
  let data = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    if (text.includes("Cannot GET")) {
      throw new Error("השרת לא מכיר ניהול זמרים — הפעילי מחדש את שרת Node.");
    }
    throw new Error("תשובת שרת לא תקינה.");
  }
  if (!res.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "שגיאה בטעינת זמרים");
  }
  return Array.isArray(data) ? data : [];
}

export async function fetchArtists() {
  const res = await fetch(`${apiOrigin()}/artists`);
  const text = await res.text();
  let data = [];
  try {
    data = text ? JSON.parse(text) : [];
  } catch {
    if (text.includes("Cannot GET")) {
      throw new Error("השרת לא מכיר ניהול זמרים — הפעילי מחדש את שרת Node מתיקיית server.");
    }
    throw new Error("תשובת שרת לא תקינה.");
  }
  if (!res.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "שגיאה בטעינת זמרים");
  }
  return Array.isArray(data) ? data : [];
}

export async function saveArtist(adminUserId, displayName, profileImageUrl) {
  const body = { adminUserId, displayName: String(displayName).trim() };
  if (profileImageUrl) body.profileImageUrl = profileImageUrl;
  const res = await fetch(`${apiOrigin()}/artists/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "שמירה נכשלה");
  }
  return data;
}

export async function uploadArtistAvatar(displayName, adminUserId, file) {
  const fd = new FormData();
  fd.append("avatar", file);
  fd.append("displayName", displayName);
  fd.append("adminUserId", adminUserId);
  const res = await fetch(`${apiOrigin()}/artists/upload-avatar`, {
    method: "POST",
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "העלאת תמונה נכשלה");
  }
  return data;
}

export async function deleteArtist({ id, displayName, nameKey, adminUserId }) {
  const payload = {
    adminUserId,
    id: String(id || "").trim(),
    displayName: String(displayName || "").trim(),
    nameKey: String(nameKey || "").trim(),
  };

  let res = await fetch(`${apiOrigin()}/artists/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok && payload.id) {
    res = await fetch(`${apiOrigin()}/artists/${encodeURIComponent(payload.id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminUserId }),
    });
  }
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (text.includes("Cannot POST")) {
      throw new Error("השרת לא מכיר מחיקת זמרים — עצרי והפעילי מחדש את שרת Node מתיקיית server.");
    }
    throw new Error("תשובת שרת לא תקינה.");
  }
  if (!res.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : "מחיקה נכשלה");
  }
  return data;
}

export async function removeArtistAvatar(displayName, adminUserId) {
  const res = await fetch(`${apiOrigin()}/artists/remove-avatar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, adminUserId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "הסרת תמונה נכשלה");
  }
  return data;
}
