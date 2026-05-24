import { apiOrigin } from "./apiBase.js";

export async function fetchUserFavorites(userId) {
  const id = String(userId || "").trim();
  if (!id) return { songIds: [], songs: [] };
  const res = await fetch(`${apiOrigin()}/favorites/user/${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || "שגיאה בטעינת מועדפים");
  }
  return {
    songIds: Array.isArray(data.songIds) ? data.songIds : [],
    songs: Array.isArray(data.songs) ? data.songs : [],
  };
}

export const FAVORITES_CHANGED_EVENT = "favorites-changed";

export function notifyFavoritesChanged() {
  window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT));
}
