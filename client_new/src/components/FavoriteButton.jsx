import { useCallback, useEffect, useState } from "react";
import { Alert, Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { apiOrigin } from "../utils/apiBase.js";
import { notifyFavoritesChanged } from "../utils/favoritesApi.js";
import { readPublisherObjectIdFromProfile } from "../utils/readPublisherIdFromProfile.js";
import { readUserProfile } from "../utils/songPermissions.js";

export default function FavoriteButton({
  songId,
  size = "medium",
  showLabel = true,
  compact = false,
  onToggled,
}) {
  const profile = readUserProfile();
  const userId = readPublisherObjectIdFromProfile(profile);

  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadStatus = useCallback(async () => {
    if (!userId || !songId) {
      setIsFavorite(false);
      return;
    }
    try {
      const q = new URLSearchParams({ userId, songId: String(songId) });
      const res = await fetch(`${apiOrigin()}/favorites/status?${q}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) setIsFavorite(Boolean(data.isFavorite));
    } catch {
      /* ignore */
    }
  }, [userId, songId]);

  useEffect(() => {
    setErr("");
    loadStatus();
  }, [loadStatus]);

  async function handleToggle(e) {
    e?.stopPropagation?.();
    if (!userId) return;
    if (!songId || loading) return;

    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${apiOrigin()}/favorites/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, songId: String(songId) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data?.message || "לא ניתן לעדכן מועדפים.");
        return;
      }
      setIsFavorite(Boolean(data.isFavorite));
      notifyFavoritesChanged();
      onToggled?.(Boolean(data.isFavorite));
    } catch {
      setErr("לא ניתן להתחבר לשרת.");
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    if (compact) return null;
    return showLabel ? (
      <Typography variant="body2" color="text.secondary">
        התחברי כדי לשמור שירים במועדפים.
      </Typography>
    ) : null;
  }

  return (
    <Box onClick={e => e.stopPropagation()}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Tooltip title={isFavorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}>
          <span>
            <IconButton
              size={size}
              color={isFavorite ? "error" : "default"}
              onClick={handleToggle}
              disabled={loading}
              aria-label={isFavorite ? "הסרה מהמועדפים" : "הוספה למועדפים"}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </span>
        </Tooltip>
        {showLabel && !compact ? (
          <Typography variant="body2" color="text.secondary">
            {isFavorite ? "במועדפים שלך" : "הוספה למועדפים"}
          </Typography>
        ) : null}
      </Stack>
      {err && !compact ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {err}
        </Alert>
      ) : null}
    </Box>
  );
}
