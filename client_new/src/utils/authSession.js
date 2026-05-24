import { fetchJson } from "./apiBase.js";

export const LS_DEVICE_ID_KEY = "deviceId";
export const LS_USER_PROFILE_KEY = "userProfile";
export const LS_SESSION_TOKEN_KEY = "sessionToken";
export const LS_ONBOARDED_KEY = "hasOnboarded";

/** סשן מנהל רק בזיכרון — נמחק ברענון/סגירת הדפדפן */
let adminSessionCache = null;

function safeParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function isAdminUser(user) {
  return user?.status === "admin";
}

function profilePayload(user) {
  return {
    username: user.username || "",
    email: user.email || "",
    status: user.status,
    userId: user._id,
  };
}

/** מנהל לא נשמר ב-localStorage */
export function purgeAdminFromLocalStorage() {
  const profile = safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
  if (profile?.status === "admin") {
    localStorage.removeItem(LS_SESSION_TOKEN_KEY);
    localStorage.removeItem(LS_USER_PROFILE_KEY);
    localStorage.removeItem(LS_ONBOARDED_KEY);
  }
}

export function getOrCreateDeviceId() {
  const existing = localStorage.getItem(LS_DEVICE_ID_KEY);
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(LS_DEVICE_ID_KEY, id);
  return id;
}

export function readStoredProfile() {
  purgeAdminFromLocalStorage();
  if (adminSessionCache?.profile) return adminSessionCache.profile;
  return safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
}

export function isLoggedInLocally() {
  purgeAdminFromLocalStorage();
  if (adminSessionCache?.sessionToken && adminSessionCache?.profile?.userId) {
    return true;
  }
  const profile = safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
  if (profile?.status === "admin") return false;
  return Boolean(
    localStorage.getItem(LS_SESSION_TOKEN_KEY) &&
      (profile?.userId || profile?.email || profile?.username)
  );
}

export function saveAuthSession({ sessionToken, user }) {
  purgeAdminFromLocalStorage();

  if (isAdminUser(user)) {
    adminSessionCache = {
      sessionToken: sessionToken ? String(sessionToken) : "",
      profile: profilePayload(user),
    };
    return;
  }

  adminSessionCache = null;
  if (sessionToken) localStorage.setItem(LS_SESSION_TOKEN_KEY, String(sessionToken));
  if (user) localStorage.setItem(LS_USER_PROFILE_KEY, JSON.stringify(profilePayload(user)));
  localStorage.setItem(LS_ONBOARDED_KEY, "true");
}

export function clearAuthSession() {
  adminSessionCache = null;
  localStorage.removeItem(LS_SESSION_TOKEN_KEY);
  localStorage.removeItem(LS_USER_PROFILE_KEY);
  localStorage.removeItem(LS_ONBOARDED_KEY);
}

function getStoredCredentials() {
  const deviceId = localStorage.getItem(LS_DEVICE_ID_KEY);
  if (adminSessionCache?.sessionToken) {
    return {
      deviceId,
      sessionToken: adminSessionCache.sessionToken,
      isAdmin: true,
    };
  }
  return {
    deviceId,
    sessionToken: String(localStorage.getItem(LS_SESSION_TOKEN_KEY) || "").trim(),
    isAdmin: false,
  };
}

/** משחזר סשן משתמש רגיל מ-localStorage; מנהל לא משוחזר אוטומטית */
export async function tryRestoreSession() {
  purgeAdminFromLocalStorage();

  const { deviceId, sessionToken, isAdmin } = getStoredCredentials();
  if (isAdmin || !deviceId || !sessionToken) {
    return { ok: false, user: null };
  }

  try {
    const { res, data } = await fetchJson("/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, sessionToken }),
    });
    if (!res.ok) {
      if (res.status === 401) clearAuthSession();
      return { ok: false, user: null };
    }
    const user = data?.user || null;
    if (!user || isAdminUser(user)) {
      clearAuthSession();
      return { ok: false, user: null };
    }
    saveAuthSession({ sessionToken, user });
    return { ok: true, user };
  } catch {
    const profile = readStoredProfile();
    if (!profile?.userId && !profile?.email) return { ok: false, user: null };
    return {
      ok: true,
      user: {
        _id: profile.userId,
        username: profile.username,
        email: profile.email,
        status: profile.status,
      },
    };
  }
}

export async function logoutSession() {
  const { deviceId, sessionToken } = getStoredCredentials();
  if (deviceId && sessionToken) {
    try {
      await fetchJson("/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId, sessionToken }),
      });
    } catch {
      /* ignore */
    }
  }
  clearAuthSession();
}
