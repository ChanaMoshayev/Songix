import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SongCoverImage from "./SongCoverImage.jsx";
import FavoriteButton from "./FavoriteButton.jsx";
import NativeAudioPlayer from "./NativeAudioPlayer.jsx";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import { recordSongPlay } from "../utils/apiBase.js";
import { resolveUploadUrl } from "../utils/mediaUrl.js";
import { isMelodyCatalogSong } from "../utils/songContentType.js";

function getFeaturedSummary(featured) {
  if (!featured?.kind) return null;

  if (featured.kind === "contest" && featured.contest) {
    const c = featured.contest;
    const isMelody = c.type === "melody";
    return {
      label: isMelody ? "לחן מוביל בתחרות" : "מילים מובילות בתחרות",
      title: c.title || "ללא כותרת",
      subtitle: c.author,
    };
  }

  if (featured.kind === "catalog" && featured.song) {
    const song = featured.song;
    const isMelody = isMelodyCatalogSong(song);
    return {
      label: isMelody ? "לחן מוביל" : "שיר מוביל",
      title: song.title || "ללא כותרת",
      subtitle: displaySongArtist(song),
    };
  }

  return null;
}

function LeadingToggleButton({ summary, open, onToggle }) {
  return (
    <Paper
      component="button"
      type="button"
      elevation={0}
      onClick={onToggle}
      aria-expanded={open}
      sx={{
        display: "block",
        width: "100%",
        p: 0,
        mb: open ? 2 : 3,
        border: "2px solid",
        borderColor: "warning.light",
        borderRadius: 3,
        direction: "rtl",
        textAlign: "inherit",
        cursor: "pointer",
        background:
          "linear-gradient(145deg, rgba(251,191,36,0.14) 0%, rgba(255,255,255,1) 60%)",
        transition: "box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          borderColor: "warning.main",
          boxShadow: "0 4px 20px rgba(251,191,36,0.2)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "warning.main",
          outlineOffset: 2,
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
        sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: "warning.main",
              color: "warning.contrastText",
              flexShrink: 0,
            }}
          >
            <EmojiEventsRoundedIcon />
          </Box>
          <Stack spacing={0.75} sx={{ minWidth: 0, textAlign: "right" }}>
            <Typography variant="subtitle2" color="warning.dark" sx={{ fontWeight: 800, lineHeight: 1.35 }}>
              {summary.label}
            </Typography>
            <Typography
              variant="body1"
              sx={{ fontWeight: 800, lineHeight: 1.4, mt: 0.25 }}
              noWrap
              title={summary.title}
            >
              {open ? "הסתרת המוביל" : summary.title}
            </Typography>
            {!open && summary.subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                title={summary.subtitle}
                sx={{ lineHeight: 1.4, display: "block", mt: 0.25 }}
              >
                {summary.subtitle}
              </Typography>
            ) : null}
            {open ? (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: "block", mt: 0.5 }}>
                לחצי שוב לסגירה
              </Typography>
            ) : (
              <Typography
                variant="caption"
                color="primary.main"
                sx={{ fontWeight: 700, lineHeight: 1.4, display: "block", mt: 0.75 }}
              >
                לחצי להצגת המוביל
              </Typography>
            )}
          </Stack>
        </Stack>
        <ExpandMoreRoundedIcon
          sx={{
            color: "warning.dark",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        />
      </Stack>
    </Paper>
  );
}

function CatalogLeadingContent({ song }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const playRecordedRef = useRef(false);
  const isMelody = isMelodyCatalogSong(song);
  const label = isMelody ? "לחן מוביל" : "שיר מוביל";
  const audioSrc = resolveUploadUrl(song.songUrl);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip icon={<EmojiEventsRoundedIcon />} label={label} color="warning" sx={{ fontWeight: 800 }} />
        <FavoriteButton songId={song._id} size="small" showLabel={false} />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} alignItems={{ md: "center" }}>
        <SongCoverImage song={song} height={200} sx={{ width: { xs: "100%", md: 220 }, borderRadius: 2, flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
            {song.title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {displaySongArtist(song)}
          </Typography>

          {audioSrc ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "grey.50",
                border: "1px solid",
                borderColor: "divider",
                mb: 2,
                overflow: "visible",
              }}
            >
              <NativeAudioPlayer
                src={audioSrc}
                resolve={false}
                audioRef={audioRef}
                onPlay={() => {
                  if (playRecordedRef.current || !song._id) return;
                  playRecordedRef.current = true;
                  recordSongPlay(song._id);
                }}
              />
            </Box>
          ) : null}

          <Button
            variant="contained"
            startIcon={<PlayArrowRoundedIcon />}
            onClick={() => navigate(`/songs/${song._id}`, { state: { autoPlayAudio: true } })}
          >
            האזנה מלאה
          </Button>
        </Box>
      </Stack>
    </Stack>
  );
}

function ContestLeadingContent({ contest: c }) {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const isMelody = c.type === "melody";
  const label = isMelody ? "לחן מוביל בתחרות" : "מילים מובילות בתחרות";
  const audioSrc =
    resolveUploadUrl(c.melodyPlayUrl) ||
    (String(c.melodyAudioDataUrl || "").trim().startsWith("data:")
      ? c.melodyAudioDataUrl
      : resolveUploadUrl(c.melodyAudioDataUrl));

  return (
    <Stack spacing={2}>
      <Chip icon={<EmojiEventsRoundedIcon />} label={label} color="warning" sx={{ alignSelf: "flex-start", fontWeight: 800 }} />
      <Typography variant="h5" sx={{ fontWeight: 900 }}>
        {c.title}
      </Typography>
      <Typography color="text.secondary">{c.author}</Typography>

      {!isMelody && c.lyrics ? (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-line",
            maxHeight: 120,
            overflow: "auto",
            bgcolor: "grey.50",
            p: 1.5,
            borderRadius: 2,
          }}
        >
          {String(c.lyrics).length > 280 ? `${String(c.lyrics).slice(0, 280)}…` : c.lyrics}
        </Typography>
      ) : null}

      {audioSrc ? (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
            overflow: "visible",
          }}
        >
          <NativeAudioPlayer src={audioSrc} resolve={false} audioRef={audioRef} />
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {isMelody ? "אין עדיין קובץ לחן להאזנה." : "מילים בלבד — האזינו לגרסה המלאה אחרי פרסום במערכת."}
        </Typography>
      )}

      <Button variant="outlined" onClick={() => navigate("/contest")}>
        לעמוד התחרות
      </Button>
    </Stack>
  );
}

export default function LeadingFeaturedSection({ featured }) {
  const [open, setOpen] = useState(false);
  const summary = getFeaturedSummary(featured);

  const featuredKey =
    featured?.kind === "contest"
      ? featured?.contest?._id
      : featured?.kind === "catalog"
        ? featured?.song?._id
        : null;

  useEffect(() => {
    setOpen(false);
  }, [featuredKey]);

  if (!summary) return null;

  const isContest = featured.kind === "contest";
  const panelBorderColor = isContest ? "secondary.light" : "warning.light";
  const panelBackground = isContest
    ? "linear-gradient(145deg, rgba(176,141,40,0.1) 0%, rgba(255,255,255,1) 55%)"
    : "linear-gradient(145deg, rgba(251,191,36,0.12) 0%, rgba(255,255,255,1) 55%)";

  return (
    <Box sx={{ mb: 3, direction: "rtl" }}>
      <LeadingToggleButton summary={summary} open={open} onToggle={() => setOpen(v => !v)} />

      <Collapse in={open} timeout="auto" unmountOnExit>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: 3,
            border: "2px solid",
            borderColor: panelBorderColor,
            background: panelBackground,
          }}
        >
          {featured.kind === "catalog" && featured.song ? (
            <CatalogLeadingContent song={featured.song} />
          ) : null}
          {featured.kind === "contest" && featured.contest ? (
            <ContestLeadingContent contest={featured.contest} />
          ) : null}
        </Paper>
      </Collapse>
    </Box>
  );
}
