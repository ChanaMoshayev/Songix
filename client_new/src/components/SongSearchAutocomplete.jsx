import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import { useAppContext } from "../context/MyContext.jsx";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";

/**
 * חיפוש שיר עם הצעות כותרת בזמן הקלדה (בסרגל העליון)
 */
export default function SongSearchAutocomplete({ value, onChange, category, onApplySearch }) {
  const navigate = useNavigate();
  const { songs } = useAppContext();
  const debounceRef = useRef(null);

  const options = useMemo(() => {
    const needle = String(value || "").trim().toLowerCase();
    if (needle.length < 1 || !Array.isArray(songs)) return [];
    return songs
      .filter(s => String(s?.title || "").toLowerCase().includes(needle))
      .slice(0, 15);
  }, [songs, value]);

  useEffect(() => {
    if (!onApplySearch) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onApplySearch(String(value || "").trim(), category);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, category, onApplySearch]);

  return (
    <Autocomplete
      freeSolo
      size="small"
      options={options}
      getOptionLabel={opt => (typeof opt === "string" ? opt : String(opt?.title || ""))}
      isOptionEqualToValue={(a, b) => String(a?._id) === String(b?._id)}
      inputValue={value}
      onInputChange={(_, newValue, reason) => {
        if (reason === "input" || reason === "clear") onChange(newValue);
      }}
      onChange={(_, selected) => {
        if (selected && typeof selected === "object" && selected._id) {
          navigate(`/songs/${selected._id}`);
        }
      }}
      filterOptions={opts => opts}
      openOnFocus={Boolean(String(value || "").trim())}
      noOptionsText="אין שירים תואמים"
      loadingText="טוען…"
      sx={{
        width: { xs: "100%", sm: 220, md: 280 },
        bgcolor: "background.paper",
        borderRadius: 2,
      }}
      slotProps={{
        paper: {
          sx: { direction: "rtl", maxHeight: 320 },
        },
        listbox: {
          sx: { direction: "rtl", textAlign: "right" },
        },
      }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder="חיפוש שיר…"
          inputProps={{
            ...params.inputProps,
            "aria-label": "חיפוש שיר",
          }}
        />
      )}
      renderOption={(props, song) => {
        const { key, ...rest } = props;
        return (
        <Box component="li" key={key} {...rest}>
          <Box sx={{ py: 0.25, width: "100%", textAlign: "right" }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {song.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {displaySongArtist(song)}
            </Typography>
          </Box>
        </Box>
        );
      }}
    />
  );
}
