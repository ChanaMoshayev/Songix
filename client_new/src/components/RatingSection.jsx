// components/RatingSection.jsx
import { useEffect, useMemo, useState } from "react";
import { Box, Typography, Rating } from "@mui/material";

const LS_SONG_RATINGS_KEY = "songRatings";

function safeParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export default function RatingSection({ songId, compact = false }) {
  // דירוג שיר — נשמר ב־localStorage תחת songRatings (נפרד מדירוגי הגשות תחרות)
  const [ratings, setRatings] = useState(() =>
    safeParseJson(localStorage.getItem(LS_SONG_RATINGS_KEY), {})
  ); // אובייקט: { songId: rating }

  const storedValue = useMemo(() => {
    const v = ratings?.[songId];
    return typeof v === "number" ? v : 0;
  }, [ratings, songId]);

  const [value, setValue] = useState(storedValue);

  useEffect(() => {
    setValue(storedValue);
  }, [storedValue]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    setRatings(prev => {
      const next = {
        ...(prev || {}),
        [songId]: newValue,
      };
      localStorage.setItem(LS_SONG_RATINGS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const stars = (
    <Box dir="ltr" sx={{ display: "inline-flex", flexDirection: "row", alignItems: "center" }}>
      <Rating
        name={`rating-${songId}`}
        value={value}
        onChange={handleChange}
        size={compact ? "medium" : "large"}
      />
    </Box>
  );

  if (compact) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
        {stars}
        {value > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {value}/5
          </Typography>
        ) : null}
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        דרג את השיר:
      </Typography>
      {stars}
      {value > 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          דירוג נוכחי: {value} כוכבים
        </Typography>
      ) : null}
    </Box>
  );
}