import { Box } from "@mui/material";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import { resolveUploadUrl } from "../utils/mediaUrl.js";

/** תמונת שער לשיר — או מקום מוצג כשאין תמונה */
export default function SongCoverImage({ song, height = 160, objectFit = "cover", sx = {} }) {
  const src = resolveUploadUrl(song?.coverImageUrl);
  const showFull = objectFit === "contain";

  return (
    <Box
      sx={{
        width: "100%",
        flexShrink: 0,
        overflow: "hidden",
        bgcolor: "grey.100",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...(showFull
          ? {
              minHeight: height,
              maxHeight: Math.max(height, 480),
              height: "auto",
              py: 1,
            }
          : { height }),
        ...sx,
      }}
    >
      {src ? (
        <Box
          component="img"
          src={src}
          alt={song?.title ? `תמונה: ${song.title}` : "תמונת שיר"}
          sx={{
            display: "block",
            width: "100%",
            ...(showFull
              ? {
                  height: "auto",
                  maxHeight: Math.max(height, 480),
                  objectFit: "contain",
                }
              : {
                  height: "100%",
                  objectFit: "cover",
                }),
          }}
        />
      ) : (
        <MusicNoteRoundedIcon sx={{ fontSize: 48, color: "grey.500", opacity: 0.7 }} />
      )}
    </Box>
  );
}
