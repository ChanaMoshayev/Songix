// pages/SongDetails.jsx
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/MyContext.jsx";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import LyricsRoundedIcon from "@mui/icons-material/LyricsRounded";
import CommentsSection from "../components/CommentsSection.jsx";
import SongSidebarList from "../components/SongSidebarList.jsx";
import RatingSection from "../components/RatingSection.jsx";
import FavoriteButton from "../components/FavoriteButton.jsx";
import SongCoverImage from "../components/SongCoverImage.jsx";
import SongEditDialog from "../components/SongEditDialog.jsx";
import { readUserProfile, canManageSong } from "../utils/songPermissions.js";
import { getSongCategoryIds, categoryNameById, getSimilarSongs } from "../utils/songCategories.js";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import { formatDurationMmSs } from "../utils/formatDuration.js";
import { recordSongPlay } from "../utils/apiBase.js";
import { resolveUploadUrl } from "../utils/mediaUrl.js";
import { isMelodyCatalogSong } from "../utils/songContentType.js";
import NativeAudioPlayer from "../components/NativeAudioPlayer.jsx";

const API = "http://localhost:5000";

export default function SongDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef(null);
  const playRecordedRef = useRef(false);
  const mainContentRef = useRef(null);
  const [sidebarHeight, setSidebarHeight] = useState(null);
  const { songs, refreshSongs } = useAppContext();
  const song = useMemo(() => songs.find(s => s._id === id), [songs, id]);
  const [audioError, setAudioError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);

  const [categories, setCategories] = useState([]);
  /** null = טרם נטען; אובייקט כולל status כדי להסתיר מפרסם admin */
  const [publisherInfo, setPublisherInfo] = useState(null);

  useEffect(() => {
    const pid = song?.publisherId != null ? String(song.publisherId) : "";
    if (!pid) {
      setPublisherInfo(null);
      return;
    }
    let cancelled = false;
    setPublisherInfo(null);
    (async () => {
      try {
        const res = await fetch(`${API}/users/${encodeURIComponent(pid)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.username) {
          setPublisherInfo({
            username: String(data.username),
            status: data.status === "admin" ? "admin" : "user",
          });
        } else {
          setPublisherInfo({ username: pid, status: "user" });
        }
      } catch {
        if (!cancelled) setPublisherInfo({ username: pid, status: "user" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [song?.publisherId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/categories`);
        const data = await res.json().catch(() => []);
        if (!cancelled && res.ok && Array.isArray(data)) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const metaLine = useMemo(() => {
    if (!song) return "";
    const parts = [];
    const catNames = getSongCategoryIds(song)
      .map(id => categoryNameById(id, categories))
      .filter(Boolean);
    if (catNames.length) parts.push(catNames.join(" · "));
    if (song.uploadDate) {
      parts.push(new Date(song.uploadDate).toLocaleDateString("he-IL"));
    }
    if (song.duration != null && song.duration !== "") {
      parts.push(formatDurationMmSs(song.duration));
    }
    return parts.join(" · ");
  }, [song, categories]);

  const similarSongs = useMemo(() => getSimilarSongs(song, songs, { limit: 12 }), [song, songs]);

  /** שירים בעמודה השמאלית — דומים קודם, אחר כך השאר (בלי השיר הנוכחי) */
  const sidebarSongs = useMemo(() => {
    if (!song?._id) return [];
    const cur = String(song._id);
    const similar = similarSongs.filter(s => String(s._id) !== cur);
    const seen = new Set(similar.map(s => String(s._id)));
    const rest = (songs || []).filter(s => String(s._id) !== cur && !seen.has(String(s._id)));
    return [...similar, ...rest];
  }, [song, songs, similarSongs]);
  const audioSrc = useMemo(() => resolveUploadUrl(song?.songUrl), [song?.songUrl]);
  const isMelody = isMelodyCatalogSong(song);

  /** תור השמעה — מועדפים/מותאם אישית, או ברירת מחדל: דומים ואז כל השירים */
  const autoplayQueueIds = useMemo(() => {
    if (!song?._id) return [];
    const fromState = location.state?.autoplayQueueIds;
    if (Array.isArray(fromState) && fromState.length > 0) {
      const byId = new Map((songs || []).map(s => [String(s._id), s]));
      const ordered = fromState
        .map(id => byId.get(String(id)))
        .filter(s => s?._id && s?.songUrl);
      if (ordered.length > 0) return ordered.map(s => s._id);
    }
    const out = [];
    const seen = new Set();
    const push = s => {
      if (!s?._id || !s?.songUrl) return;
      const sid = String(s._id);
      if (seen.has(sid)) return;
      seen.add(sid);
      out.push(s._id);
    };
    push(song);
    similarSongs.forEach(push);
    (songs || []).forEach(push);
    return out;
  }, [song, similarSongs, songs, location.state?.autoplayQueueIds]);

  const playlistLabel = location.state?.playlistLabel;

  const handleAudioEnded = useCallback(() => {
    if (!song?._id || autoplayQueueIds.length <= 1) return;
    const cur = String(song._id);
    const idx = autoplayQueueIds.findIndex(x => String(x) === cur);
    const base = idx >= 0 ? idx : 0;
    const nextIdx = base + 1;
    if (playlistLabel && nextIdx >= autoplayQueueIds.length) return;
    const nextId = autoplayQueueIds[(base + 1) % autoplayQueueIds.length];
    navigate(`/songs/${nextId}`, {
      replace: true,
      state: {
        autoPlayAudio: true,
        autoplayQueueIds,
        playlistLabel,
      },
    });
  }, [song?._id, autoplayQueueIds, navigate, playlistLabel]);

  /** מעבר לשיר — גלילה לראש העמוד */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);

  /** גובה הצד השמאלי = תוכן השיר עד לפני תגובות (עם גלילה פנימית ברשימה) */
  useEffect(() => {
    const el = mainContentRef.current;
    if (!el || typeof ResizeObserver === "undefined") {
      setSidebarHeight(null);
      return undefined;
    }

    const sync = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (h > 0) setSidebarHeight(h);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    window.addEventListener("resize", sync);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [song?._id, lyricsOpen, audioError, publisherInfo]);

  /** כל מעבר לשיר אחר — עוצר את הנגן (אלמנט חדש בגלל key עוצר גם פלט פיזי) */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    playRecordedRef.current = false;
  }, [song?._id]);

  const handleAudioPlay = useCallback(() => {
    if (playRecordedRef.current || !song?._id) return;
    playRecordedRef.current = true;
    recordSongPlay(song._id);
  }, [song?._id]);

  /** לחיצה על שיר דומה — מעבירה state; אחרי טעינת הקובץ מתחילים נגינה ומנקים state */
  useEffect(() => {
    if (!location.state?.autoPlayAudio || !audioSrc) return;
    const el = audioRef.current;
    if (!el) return;

    let cleared = false;
    const onCanPlay = () => {
      el.currentTime = 0;
      void el.play().catch(() => {});
      if (!cleared) {
        cleared = true;
        const keepState = {};
        if (Array.isArray(location.state?.autoplayQueueIds)) {
          keepState.autoplayQueueIds = location.state.autoplayQueueIds;
        }
        if (location.state?.playlistLabel) keepState.playlistLabel = location.state.playlistLabel;
        navigate(
          { pathname: location.pathname, search: location.search, hash: location.hash },
          { replace: true, state: keepState }
        );
      }
    };

    el.addEventListener("canplay", onCanPlay, { once: true });
    if (el.readyState >= 3) queueMicrotask(onCanPlay);
    return () => el.removeEventListener("canplay", onCanPlay);
  }, [song?._id, audioSrc, location.state, navigate, location.pathname, location.search, location.hash]);

  const profile = useMemo(() => readUserProfile(), []);
  const canManage = useMemo(() => canManageSong(profile, song), [profile, song]);

  async function confirmDelete() {
    if (!song?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/songs/${song._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert(typeof data === "string" ? data : data?.message || "מחיקה נכשלה");
        return;
      }
      setDeleteOpen(false);
      await refreshSongs();
      navigate("/songs", { replace: true });
    } catch {
      // eslint-disable-next-line no-alert
      alert("לא ניתן להתחבר לשרת.");
    } finally {
      setDeleting(false);
    }
  }

  if (!song) return <Typography sx={{ mt: 4, px: 2 }}>Loading...</Typography>;

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, sm: 3 }, mb: { xs: 4, sm: 6 } }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(300px, 380px) minmax(0, 1fr)" },
          gap: { xs: 3, lg: 3.5 },
          alignItems: "start",
          direction: "ltr",
        }}
      >
        {/* עמודה שמאלית — גובה כמו תוכן השיר (לפני תגובות), גלילה ברשימה */}
        <Box
          sx={{
            order: { xs: 2, lg: 1 },
            minWidth: 0,
            alignSelf: { lg: "flex-start" },
          }}
        >
          <Paper
            sx={{
              p: { xs: 2, sm: 2.5 },
              display: "flex",
              flexDirection: "column",
              direction: "rtl",
              overflow: "hidden",
              boxSizing: "border-box",
              ...(sidebarHeight
                ? {
                    height: { lg: sidebarHeight },
                    maxHeight: { lg: sidebarHeight },
                  }
                : {}),
            }}
          >
            {sidebarSongs.length > 0 ? (
              <SongSidebarList
                songs={sidebarSongs}
                currentSongId={song._id}
                title="שירים נוספים"
                autoplayQueueIds={autoplayQueueIds}
                playlistLabel={playlistLabel}
                fillHeight
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                אין שירים נוספים להצגה.
              </Typography>
            )}
          </Paper>
        </Box>

        {/* עמודה ימנית — השיר הפעיל (תגובות מתחת, מחוץ לאזור ההשוואה לגובה) */}
        <Box sx={{ order: { xs: 1, lg: 2 }, minWidth: 0, direction: "rtl" }}>
      <Paper ref={mainContentRef} sx={{ p: { xs: 2, sm: 3 }, boxSizing: "border-box" }}>
        <SongCoverImage
          song={song}
          height={360}
          objectFit="contain"
          sx={{ borderRadius: 2, mb: 2, height: "auto" }}
        />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "flex-start" }}
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h4" component="span" sx={{ wordBreak: "break-word" }}>
              {song.title}
            </Typography>
            {isMelody ? <Chip size="small" label="לחן" color="secondary" /> : null}
          </Stack>
          {canManage ? (
            <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" onClick={() => setEditOpen(true)}>
                עדכון
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
                מחיקה
              </Button>
            </Stack>
          ) : null}
        </Stack>

        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 0.5 }}>
          {displaySongArtist(song)}
        </Typography>

        {publisherInfo && publisherInfo.status !== "admin" ? (
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            הועלה ע״י: {publisherInfo.username}
          </Typography>
        ) : null}

        {metaLine ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {metaLine}
          </Typography>
        ) : null}

        <Divider sx={{ my: 2 }} />

        {audioSrc ? (
          <>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
                overflow: "visible",
              }}
            >
              <NativeAudioPlayer
                key={song._id}
                src={audioSrc}
                resolve={false}
                audioRef={audioRef}
                onError={() => setAudioError(true)}
                onCanPlay={() => setAudioError(false)}
                onPlay={handleAudioPlay}
                onEnded={handleAudioEnded}
              />
            </Box>
            {playlistLabel ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                מנגן מתוך: {playlistLabel}
              </Typography>
            ) : null}
            {audioError ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                לא הצלחתי להפעיל את השיר. כנראה שה־URL לא מצביע על קובץ MP3 נגיש.{" "}
                <Link href={audioSrc} target="_blank" rel="noreferrer">
                  פתיחה בקישור
                </Link>
              </Alert>
            ) : null}
          </>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            אין קישור שיר (`songUrl`) לשיר הזה.
          </Alert>
        )}

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          useFlexGap
          spacing={1.5}
          sx={{ mt: 2, py: 1.25, px: 0.5 }}
        >
          <Button
            variant={lyricsOpen ? "contained" : "outlined"}
            size="small"
            startIcon={<LyricsRoundedIcon />}
            endIcon={
              <ExpandMoreRoundedIcon
                sx={{
                  transform: lyricsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.25s",
                }}
              />
            }
            onClick={() => setLyricsOpen(v => !v)}
            sx={{
              "& .MuiButton-startIcon": { margin: 0, marginInlineEnd: "4px" },
              "& .MuiButton-endIcon": { margin: 0, marginInlineStart: "4px" },
            }}
          >
            {lyricsOpen ? "הסתרת מילים" : "הצגת מילים"}
          </Button>

          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
            <RatingSection songId={song._id} compact />
            <FavoriteButton songId={song._id} compact showLabel={false} />
          </Stack>
        </Stack>

        <Collapse in={lyricsOpen} timeout="auto">
          <Paper
            elevation={0}
            sx={{
              mt: 1.5,
              p: 2.5,
              borderRadius: 2,
              bgcolor: "grey.50",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography sx={{ whiteSpace: "pre-wrap", lineHeight: 1.85, fontSize: "1.05rem", textAlign: "right" }}>
              {song.lyrics || "אין מילים לשיר זה."}
            </Typography>
          </Paper>
        </Collapse>
      </Paper>

        <Box sx={{ mt: 3 }}>
          <CommentsSection songId={song._id} />
        </Box>
        </Box>
      </Box>

      <SongEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        song={song}
        onSaved={async () => {
          await refreshSongs();
        }}
      />

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} dir="rtl">
        <DialogTitle>מחיקת שיר</DialogTitle>
        <DialogContent>
          <DialogContentText>למחוק את «{song.title}»? פעולה זו לא ניתנת לביטול.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            ביטול
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "מוחק…" : "מחיקה"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}