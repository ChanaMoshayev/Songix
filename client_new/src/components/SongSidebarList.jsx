import { Box, Typography } from "@mui/material";
import SongSidebarItem from "./SongSidebarItem.jsx";

/** רשימת שירים אנכית — עמודת המלצות כמו YouTube */
export default function SongSidebarList({
  songs,
  currentSongId,
  title = "שירים נוספים",
  autoplayQueueIds,
  playlistLabel,
  fillHeight = false,
}) {
  if (!Array.isArray(songs) || songs.length === 0) return null;

  return (
    <Box
      sx={{
        direction: "rtl",
        ...(fillHeight
          ? {
              flex: 1,
              minHeight: 0,
              height: "100%",
              display: "flex",
              flexDirection: "column",
            }
          : {}),
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, px: 0.5, flexShrink: 0 }}>
        {title}
      </Typography>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          overflowY: "auto",
          pr: 0.5,
          ...(fillHeight
            ? { flex: 1, minHeight: 0 }
            : { maxHeight: { lg: "calc(100vh - 120px)" } }),
        }}
      >
        {songs.map(s => (
          <SongSidebarItem
            key={s._id}
            song={s}
            active={String(s._id) === String(currentSongId)}
            autoplayQueueIds={autoplayQueueIds}
            playlistLabel={playlistLabel}
          />
        ))}
      </Box>
    </Box>
  );
}
