import { useRef } from "react";
import { recordSongPlay } from "../utils/apiBase.js";
import NativeAudioPlayer from "./NativeAudioPlayer.jsx";

/**
 * נגן אודיו לשיר/לחן — מונע מעבר לדף השיר בלחיצה על הבקרים
 */
export default function SongAudioPlayer({ songId, songUrl, wrapSx }) {
  const playRecordedRef = useRef(false);
  if (!String(songUrl || "").trim()) return null;

  return (
    <NativeAudioPlayer
      src={songUrl}
      wrapSx={wrapSx}
      wrapProps={{
        onClick: e => e.stopPropagation(),
        onMouseDown: e => e.stopPropagation(),
      }}
      onPlay={() => {
        if (playRecordedRef.current || !songId) return;
        playRecordedRef.current = true;
        recordSongPlay(songId);
      }}
    />
  );
}
