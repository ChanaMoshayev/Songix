import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import SongCoverImage from "./SongCoverImage.jsx";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import { formatDurationMmSs } from "../utils/formatDuration.js";
import { isMelodyCatalogSong } from "../utils/songContentType.js";

/** שורת שיר בצד — בסגנון YouTube */
export default function SongSidebarItem({
  song,
  active = false,
  autoplayQueueIds,
  playlistLabel,
  navigateWithAudioAutoplay = true,
}) {
  const navigate = useNavigate();
  if (!song?._id) return null;

  const isMelody = isMelodyCatalogSong(song);

  return (
    <Box
      component="button"
      type="button"
      onClick={() => {
        navigate(`/songs/${song._id}`, {
          state: {
            autoPlayAudio: navigateWithAudioAutoplay,
            autoplayQueueIds,
            playlistLabel,
          },
        });
      }}
      sx={{
        display: "flex",
        gap: 1.25,
        width: "100%",
        p: 1,
        border: "none",
        borderRadius: 2,
        cursor: active ? "default" : "pointer",
        textAlign: "right",
        direction: "rtl",
        bgcolor: active ? "action.selected" : "transparent",
        transition: "background-color 0.15s",
        "&:hover": active ? undefined : { bgcolor: "action.hover" },
      }}
    >
      <Box
        sx={{
          width: 120,
          flexShrink: 0,
          borderRadius: 1.5,
          overflow: "hidden",
        }}
      >
        <SongCoverImage song={song} height={68} sx={{ width: 120, height: 68 }} />
      </Box>
      <Stack spacing={0.35} sx={{ flex: 1, minWidth: 0, py: 0.25 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: active ? 800 : 700,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: 1.35,
            color: active ? "primary.main" : "text.primary",
          }}
        >
          {song.title}
          {isMelody ? " · לחן" : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {displaySongArtist(song)}
        </Typography>
        {song.duration != null && song.duration !== "" ? (
          <Typography variant="caption" color="text.secondary">
            {formatDurationMmSs(song.duration)}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
