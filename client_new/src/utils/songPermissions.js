import { readStoredProfile } from "./authSession.js";

export function readUserProfile() {
  return readStoredProfile();
}

/** מפרסם השיר או מנהל — רשאים לערוך/למחוק */
export function canManageSong(profile, song) {
  if (!song) return false;
  if (!profile) return false;
  if (profile.status === "admin") return true;
  if (!profile.userId) return false;
  return String(song.publisherId) === String(profile.userId);
}
