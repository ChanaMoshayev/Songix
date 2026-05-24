import { useAppContext } from "../context/MyContext";
import SongList from "../components/SongList";
import SongsArtistsStrip from "../components/SongsArtistsStrip.jsx";
import LeadingFeaturedSection from "../components/LeadingFeaturedSection.jsx";
import { fetchSongsPageFeatured } from "../utils/apiBase.js";
import { useMemo, useState, useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { orderSongsForFeed } from "../utils/shuffleFeed.js";
import { Box, Button, Container, Typography, CircularProgress, Alert, Stack } from "@mui/material";
import { songHasCategory } from "../utils/songCategories.js";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import { songFeaturesArtist } from "../utils/songArtists.js";

/** הפעילי ל־true כשתרצי להציג שוב את פס «זמרים במערכת» */
const SHOW_ARTISTS_STRIP = true;

export default function SongsPage() {
  const { songs, loading, error, refreshSongs, songsPageFeatured, setSongsPageFeatured } = useAppContext();

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [feedOrder, setFeedOrder] = useState([]);

  const q = String(searchParams.get("q") || "").trim().toLowerCase();
  const category = String(searchParams.get("category") || "").trim();
  const artistFilter = String(searchParams.get("artist") || "").trim();
  const hasFilters = Boolean(q || category || artistFilter);

  /** עדכון שקט אחרי חזרה מתחרות — המוביל כבר מוצג מהמטמון */
  useEffect(() => {
    if (!location.pathname.startsWith("/songs")) return;
    let cancelled = false;
    fetchSongsPageFeatured()
      .then(data => {
        if (!cancelled) setSongsPageFeatured(data?.kind === "contest" ? data : null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.key, setSongsPageFeatured]);

  const filteredSongs = useMemo(() => {
    if (!Array.isArray(songs)) return [];
    return songs.filter(s => {
      const okCategory = songHasCategory(s, category);
      const title = String(s?.title || "").toLowerCase();
      const artist = displaySongArtist(s).toLowerCase();
      const okQ = !q || title.includes(q) || artist.includes(q);
      const okArtist = !artistFilter || songFeaturesArtist(s, artistFilter);
      return okCategory && okQ && okArtist;
    });
  }, [songs, q, category, artistFilter]);

  useEffect(() => {
    if (!location.pathname.startsWith("/songs") || loading) return;

    if (hasFilters) {
      setFeedOrder(filteredSongs);
      return;
    }

    setFeedOrder(orderSongsForFeed(filteredSongs));
  }, [location.pathname, location.key, loading, filteredSongs, hasFilters]);

  const showFeatured = Boolean(songsPageFeatured?.kind);
  const showSongList = !loading && !error && feedOrder.length > 0;

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 4, sm: 6 } }}>
      <Stack spacing={0.75} sx={{ mb: 3 }}>
        <Typography variant="h4">כל השירים</Typography>
        <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 640 }}>
          סדר השירים מתחלף בכל כניסה — שירים פופולריים ומועדפים מופיעים לעיתים קרובות בראש, עם מבחר משתנה.
        </Typography>
      </Stack>

      {loading && !showFeatured && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refreshSongs()}>
              נסי שוב
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {SHOW_ARTISTS_STRIP && !loading && !error ? (
        <Box sx={{ mb: showFeatured ? { xs: 3, sm: 4 } : 3 }}>
          <SongsArtistsStrip />
        </Box>
      ) : null}

      {showFeatured ? <LeadingFeaturedSection featured={songsPageFeatured} /> : null}

      {!loading && !error && filteredSongs.length === 0 && !showFeatured && (
        <Alert severity="info" sx={{ mt: 1 }}>
          {artistFilter
            ? `אין שירים של «${artistFilter}» עם הסינון הנוכחי.`
            : "לא נמצאו שירים התואמים לסינון או לחיפוש."}
        </Alert>
      )}

      {showSongList ? <SongList songs={feedOrder} navigateWithAudioAutoplay /> : null}

      {loading && showFeatured ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : null}
    </Container>
  );
}
