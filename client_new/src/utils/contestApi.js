import { apiOrigin, fetchJson } from "./apiBase.js";
import { readPublisherObjectIdFromProfile } from "./readPublisherIdFromProfile.js";

function profileUserId(profile) {
  return readPublisherObjectIdFromProfile(profile) || String(profile?.userId || "").trim();
}

function apiErrorMessage(data, fallback) {
  if (data && typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (data?._nonJson && typeof data._text === "string" && data._text.includes("Cannot")) {
    return "השרת לא מעודכן — עצרי והפעילי מחדש את שרת Node (תיקיית server).";
  }
  return fallback;
}

export async function fetchContestStats() {
  const res = await fetch(`${apiOrigin()}/contest-submissions/stats`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "שגיאה בטעינת סטטיסטיקה");
  return data;
}

export function contestSubmissionsQuery(profile) {
  const params = new URLSearchParams();
  const uid = profileUserId(profile);
  if (uid) params.set("viewerUserId", uid);
  if (profile?.status === "admin" && uid) {
    params.set("adminUserId", uid);
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function fetchContestSubmissions(profile) {
  const res = await fetch(`${apiOrigin()}/contest-submissions${contestSubmissionsQuery(profile)}`);
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    const msg = typeof data === "object" && data?.message ? data.message : "שגיאה בטעינת תחרות";
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

export async function rateContestSubmission(submissionId, raterUserId, stars) {
  const { res, data } = await fetchJson(`/contest-submissions/${submissionId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raterUserId, stars }),
  });
  if (!res.ok) {
    throw new Error(apiErrorMessage(data, "שמירת דירוג נכשלה"));
  }
  return data;
}

export async function promoteContestSubmission(submissionId, body) {
  const { res, data } = await fetchJson(`/contest-submissions/${submissionId}/promote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(apiErrorMessage(data, "הוספה למערכת נכשלה"));
  }
  return data;
}
