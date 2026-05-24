import { Navigate } from "react-router-dom";
import { readStoredProfile } from "../utils/authSession.js";

/** מאפשר גישה לעמודי /admin רק למנהל מחובר בטאב הנוכחי */
export default function AdminRoute({ children }) {
  const profile = readStoredProfile();
  if (profile?.status !== "admin") {
    return <Navigate to="/login" replace />;
  }
  return children;
}
