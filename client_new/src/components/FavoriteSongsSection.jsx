import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SongList from "./SongList.jsx";
import { FAVORITES_CHANGED_EVENT, fetchUserFavorites } from "../utils/favoritesApi.js";
import { useAppContext } from "../context/MyContext.jsx";

/** רשימת מועדפים + השמעה ברצף */
export default function FavoriteSongsSection({ userId }) {
  const navigate = useNavigate();
  const { songs: allSongs } = useAppContext();
  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setFavoriteSongs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const { songs, songIds } = await fetchUserFavorites(userId);
      const byId = new Map((allSongs || []).map(s => [String(s._id), s]));
      const merged = songIds
        .map(id => byId.get(String(id)) || songs.find(s => String(s._id) === String(id)))
        .filter(Boolean);
      setFavoriteSongs(merged.length ? merged : songs);
    } catch (e) {
      setFavoriteSongs([]);
      setErr(e?.message || "לא ניתן לטעון מועדפים");
    } finally {
      setLoading(false);
    }
  }, [userId, allSongs]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onChange = () => load();
    window.addEventListener(FAVORITES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, onChange);
  }, [load]);

  const playableQueue = useMemo(
    () => favoriteSongs.filter(s => s?._id && s?.songUrl).map(s => s._id),
    [favoriteSongs]
  );

  function playFavoritesSequence() {
    if (playableQueue.length === 0) return;
    const firstId = playableQueue[0];
    navigate(`/songs/${firstId}`, {
      state: {
        autoPlayAudio: true,
        autoplayQueueIds: playableQueue,
        playlistLabel: "מועדפים",
      },
    });
  }

  return (
    <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, mt: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 1 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <FavoriteIcon color="error" />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              שירים מועדפים
            </Typography>
          </Stack>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
            שירים שסימנת בלחיצה על הלב — אפשר להשמיע אותם ברצף.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlayArrowRoundedIcon />}
          disabled={playableQueue.length === 0 || loading}
          onClick={playFavoritesSequence}
          sx={{ borderRadius: 2 }}
        >
          השמע מועדפים ברצף
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
          <CircularProgress size={32} />
        </Box>
      ) : err ? (
        <Alert severity="error">{err}</Alert>
      ) : favoriteSongs.length === 0 ? (
        <Alert severity="info">
          עדיין אין שירים במועדפים. לחצי על אייקון הלב ליד שיר כדי להוסיף.
        </Alert>
      ) : (
        <SongList songs={favoriteSongs} navigateWithAudioAutoplay />
      )}
    </Paper>
  );
}
