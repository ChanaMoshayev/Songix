import { createContext, useContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { getPostLoginPath } from "../utils/postLoginPath.js";
import { isLoggedInLocally, readStoredProfile, tryRestoreSession } from "../utils/authSession.js";

const AuthContext = createContext({ ready: false, user: null });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: false, user: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isLoggedInLocally()) {
        if (!cancelled) setState({ ready: true, user: null });
        return;
      }
      const result = await tryRestoreSession();
      let user = result.ok ? result.user : null;
      if (!user && isLoggedInLocally()) {
        const profile = readStoredProfile();
        if (profile) {
          user = {
            _id: profile.userId,
            username: profile.username,
            email: profile.email,
            status: profile.status,
          };
        }
      }
      if (!cancelled) {
        setState({ ready: true, user });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state.ready) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

/** דפי התחברות/הרשמה — מפנים לשירים (או ניהול) אם כבר מחוברים */
export function RedirectIfAuthed({ children }) {
  const { user } = useAuth();
  const profile = readStoredProfile();
  const authedUser =
    user ||
    (isLoggedInLocally() && profile
      ? { _id: profile.userId, username: profile.username, email: profile.email, status: profile.status }
      : null);
  if (authedUser) {
    return <Navigate to={getPostLoginPath(authedUser)} replace />;
  }
  return children;
}
