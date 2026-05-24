import SongCard from "./SongCard";
import { Box } from "@mui/material";

/**
 * רשת שירים אחידה: 1 / 2 / 3 / 4 כרטיסים בשורה (לפי רוחב מסך)
 * navigateWithAudioAutoplay — מעביר לעמוד השיר ומפעיל נגן אוטומטית
 */
export default function SongList({ songs, navigateWithAudioAutoplay = false }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        gap: { xs: 2, sm: 2.5, md: 3 },
        alignItems: "stretch",
        width: "100%",
      }}
    >
      {songs.map(song => (
        <Box key={song._id} sx={{ minWidth: 0, display: "flex" }}>
          <SongCard song={song} navigateWithAudioAutoplay={navigateWithAudioAutoplay} />
        </Box>
      ))}
    </Box>
  );
}
