import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { artistInitials } from "../utils/songArtists.js";
import { resolveUploadUrl } from "../utils/mediaUrl.js";
import { fetchArtistsForStrip } from "../utils/artistsApi.js";
import { shuffleArray } from "../utils/shuffleFeed.js";

function ArtistCircle({ artist, selected, onClick }) {
  const avatarSrc = resolveUploadUrl(artist.profileImageUrl);

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        border: "none",
        background: "none",
        cursor: "pointer",
        p: 0,
        width: 88,
        flexShrink: 0,
        textAlign: "center",
      }}
    >
      <Avatar
        src={avatarSrc}
        alt={artist.name}
        sx={{
          width: 72,
          height: 72,
          mx: "auto",
          fontWeight: 800,
          bgcolor: "grey.300",
          border: "3px solid",
          borderColor: selected ? "primary.main" : "transparent",
          boxShadow: selected
            ? theme =>
                `0 0 0 2px ${theme.palette.background.paper}, 0 4px 14px rgba(0,0,0,0.15)`
            : "0 2px 8px rgba(0,0,0,0.08)",
          transition: "transform 0.2s",
          "&:hover": { transform: "scale(1.05)" },
        }}
      >
        {!avatarSrc ? artistInitials(artist.name) : null}
      </Avatar>
      <Typography
        variant="caption"
        sx={{
          display: "block",
          mt: 1,
          fontWeight: selected ? 800 : 600,
          color: selected ? "primary.main" : "text.primary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
        }}
        title={artist.name}
      >
        {artist.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem" }}>
        {artist.songCount} שירים
      </Typography>
    </Box>
  );
}

/** זמרים עם תמונה בלבד — סדר אקראי בכל כניסה לעמוד */
export default function SongsArtistsStrip() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedArtist = String(searchParams.get("artist") || "").trim();

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const loadArtists = useCallback(async () => {
    setLoading(true);
    setLoadErr("");
    try {
      const list = await fetchArtistsForStrip();
      setArtists(shuffleArray(list));
    } catch (e) {
      setArtists([]);
      setLoadErr(e?.message || "שגיאה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/songs")) return;
    loadArtists();
  }, [location.pathname, location.key, loadArtists]);

  function setArtistFilter(name) {
    const next = new URLSearchParams(searchParams);
    if (name) next.set("artist", name);
    else next.delete("artist");
    setSearchParams(next);
  }

  if (!loading && !loadErr && artists.length === 0) {
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        עדיין אין זמרים בפס. מנהל/ת: הוסיפי זמרים ב«ניהול → זמרים» (שם + תמונה).
      </Alert>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.5 },
        mb: 0,
        borderRadius: 3,
        direction: "rtl",
        border: "1px solid",
        borderColor: "divider",
        background: theme =>
          `linear-gradient(180deg, ${theme.palette.grey[50]} 0%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <MusicNoteRoundedIcon color="primary" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            זמרים במערכת
          </Typography>
          <Typography variant="caption" color="text.secondary">
            רק זמרים מטבלת הניהול · סדר מתחלף בכל כניסה
          </Typography>
        </Box>
      </Stack>

      {loadErr ? <Alert severity="warning" sx={{ mb: 1 }}>{loadErr}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 0.5,
            scrollbarWidth: "thin",
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setArtistFilter("")}
            sx={{
              border: "none",
              background: "none",
              cursor: "pointer",
              p: 0,
              width: 88,
              flexShrink: 0,
              textAlign: "center",
            }}
          >
            <Avatar
              sx={{
                width: 72,
                height: 72,
                mx: "auto",
                bgcolor: !selectedArtist ? "primary.main" : "grey.300",
                color: !selectedArtist ? "primary.contrastText" : "text.secondary",
                fontWeight: 800,
                fontSize: "0.85rem",
                border: "3px solid",
                borderColor: !selectedArtist ? "primary.dark" : "transparent",
              }}
            >
              הכל
            </Avatar>
            <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: !selectedArtist ? 800 : 600 }}>
              כל הזמרים
            </Typography>
          </Box>

          {artists.map(artist => (
            <ArtistCircle
              key={artist.nameKey || artist.name}
              artist={artist}
              selected={selectedArtist === artist.name}
              onClick={() =>
                setArtistFilter(selectedArtist === artist.name ? "" : artist.name)
              }
            />
          ))}
        </Box>
      )}
    </Paper>
  );
}
