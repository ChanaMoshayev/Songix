import { useEffect, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import NativeAudioPlayer from "./NativeAudioPlayer.jsx";
import { resolveUploadUrl } from "../utils/mediaUrl.js";

/** נגן לחן להגשת תחרות */
export default function ContestMelodyPlayer({ submission, compact = false }) {
  const playUrl = submission?.melodyPlayUrl || "";
  const dataUrl = String(submission?.melodyAudioDataUrl || "").trim();
  const hasAudio = Boolean(submission?.hasMelodyAudio || playUrl || dataUrl.startsWith("data:"));

  const src = useMemo(
    () =>
      resolveUploadUrl(playUrl) ||
      (dataUrl.startsWith("data:") ? dataUrl : resolveUploadUrl(dataUrl)),
    [playUrl, dataUrl]
  );

  useEffect(() => {
    if (!src || src.startsWith("data:")) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "audio";
    link.href = src;
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [src]);

  if (!hasAudio) {
    return (
      <Typography variant="body2" color="text.secondary">
        לא הועלה קובץ לחן להאזנה.
      </Typography>
    );
  }

  if (!src) {
    return (
      <Typography variant="body2" color="text.secondary">
        טוען לחן… אם לא מתנגן, רענני את העמוד.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: compact ? 420 : "100%",
        p: compact ? 1 : 1.5,
        borderRadius: 2,
        bgcolor: "grey.50",
        border: "1px solid",
        borderColor: "divider",
        overflow: "visible",
      }}
    >
      <NativeAudioPlayer src={src} resolve={false} preload="auto" />
    </Box>
  );
}
