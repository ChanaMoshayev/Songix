import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import FavoriteSongsSection from "../components/FavoriteSongsSection.jsx";
import { readPublisherObjectIdFromProfile } from "../utils/readPublisherIdFromProfile.js";
import { readUserProfile } from "../utils/songPermissions.js";
import {
  Avatar,
  Box,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function ProfilePage() {
  const { userId } = useParams();
  const profile = useMemo(() => readUserProfile(), []);
  const ownUserId = readPublisherObjectIdFromProfile(profile);
  const isOwnProfile = Boolean(ownUserId && String(userId) === String(ownUserId));

  if (!ownUserId) {
    return <Navigate to="/login" replace />;
  }

  if (!isOwnProfile) {
    return <Navigate to="/songs" replace />;
  }

  const displayName = profile?.username ? String(profile.username) : "המשתמש שלי";
  const initials = displayName.slice(0, 2).toUpperCase() || "?";

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 4, sm: 6 } }}>
      <Paper
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          direction: "rtl",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: theme =>
              `radial-gradient(1200px 400px at 10% 0%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 60%), radial-gradient(900px 300px at 90% 20%, ${alpha(theme.palette.primary.dark, 0.1)}, transparent 55%)`,
          }}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ position: "relative" }}
        >
          <Avatar
            sx={{
              width: { xs: 84, sm: 96 },
              height: { xs: 84, sm: 96 },
              fontSize: { xs: 28, sm: 32 },
              bgcolor: "primary.main",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              order: { xs: 0, sm: 2 },
            }}
          >
            {initials}
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0, textAlign: "right", order: { xs: 1, sm: 1 } }}>
            <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
              שלום, {displayName}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              הפרופיל האישי שלך — שירים מועדפים והאזנה ברצף. רשימת השירים שהעלית אינה מוצגת כאן.
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <FavoriteSongsSection userId={ownUserId} />
    </Container>
  );
}
