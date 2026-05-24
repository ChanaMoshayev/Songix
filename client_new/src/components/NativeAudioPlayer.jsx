import { Box } from "@mui/material";
import { resolveUploadUrl } from "../utils/mediaUrl.js";

export const NATIVE_AUDIO_CLASS = "app-native-audio";

/**
 * נגן HTML5 עם פס התקדמות ועצירה — לא לקבוע height על האלמנט (שובר בקרים ב-Chrome).
 */
export default function NativeAudioPlayer({
  src,
  audioRef,
  wrapSx,
  wrapProps,
  resolve = true,
  ...audioProps
}) {
  const raw = String(src || "").trim();
  if (!raw) return null;

  const resolved =
    !resolve || raw.startsWith("data:")
      ? raw
      : resolveUploadUrl(raw) || raw;

  return (
    <Box
      className={`${NATIVE_AUDIO_CLASS}-wrap`}
      {...wrapProps}
      sx={{
        width: "100%",
        direction: "ltr",
        minHeight: 54,
        flexShrink: 0,
        overflow: "visible",
        ...wrapSx,
      }}
    >
      <audio
        ref={audioRef}
        className={NATIVE_AUDIO_CLASS}
        controls
        preload="metadata"
        src={resolved}
        {...audioProps}
      />
    </Box>
  );
}
