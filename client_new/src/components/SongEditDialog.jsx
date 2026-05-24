import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { apiPath, fetchJson, uploadSongAudioFile, uploadSongCoverFile } from "../utils/apiBase.js";
import {
  COVER_FILE_ACCEPT,
  coverFileRejectMessage,
  isAllowedCoverImageFile,
} from "../utils/coverImageFile.js";
import SongCoverImage from "./SongCoverImage.jsx";
import { getSongCategoryIds } from "../utils/songCategories.js";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import { formatDurationMmSs, parseDurationToSeconds } from "../utils/formatDuration.js";

export default function SongEditDialog({ open, onClose, song, onSaved }) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [duration, setDuration] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [hadCoverOnOpen, setHadCoverOnOpen] = useState(false);

  useEffect(() => {
    if (!open || !song) return;
    const existingCover = String(song.coverImageUrl || "").trim();
    setHadCoverOnOpen(Boolean(existingCover));
    setTitle(String(song.title || ""));
    setArtist(displaySongArtist(song));
    setLyrics(String(song.lyrics || ""));
    setSongUrl(String(song.songUrl || ""));
    setCategoryIds(getSongCategoryIds(song));
    setDuration(song.duration != null ? formatDurationMmSs(song.duration) : "");
    setCoverImageUrl(existingCover);
    setErr("");
  }, [open, song]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingCats(true);
      try {
        const res = await fetch(apiPath("/categories"));
        const data = await res.json().catch(() => []);
        if (!cancelled && res.ok && Array.isArray(data)) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onCoverFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedCoverImageFile(file)) {
      setErr(coverFileRejectMessage(file));
      return;
    }
    setErr("");
    setCoverUploading(true);
    const out = await uploadSongCoverFile(file);
    setCoverUploading(false);
    if (!out.ok) {
      setErr(out.message || "העלאת תמונה נכשלה");
      return;
    }
    setCoverImageUrl(out.coverImageUrl);
  }

  async function onAudioFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setAudioUploading(true);
    const out = await uploadSongAudioFile(file);
    setAudioUploading(false);
    if (!out.ok) {
      setErr(out.message || "העלאה נכשלה");
      return;
    }
    setSongUrl(out.songUrl);
  }

  async function handleSave() {
    if (!song?._id) return;
    setErr("");
    const dur = parseDurationToSeconds(duration);
    if (!title.trim() || !artist.trim() || !lyrics.trim() || !songUrl.trim() || categoryIds.length === 0) {
      setErr("מלאי כותרת, אמן, מילים, קישור או קובץ שיר, ולפחות קטגוריה אחת.");
      return;
    }
    if (!Number.isFinite(dur) || dur <= 0) {
      setErr("משך לא תקין. השתמשי בדקות:שניות (למשל 3:45) או מספר שניות.");
      return;
    }

    setSaving(true);
    try {
      const { res, data } = await fetchJson(`/songs/${song._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          lyrics: lyrics.trim(),
          songUrl: songUrl.trim(),
          categoryIds,
          publisherId: song.publisherId,
          duration: dur,
          coverImageUrl: coverImageUrl.trim() || "",
        }),
      });
      if (!res.ok) {
        setErr(typeof data === "string" ? data : data?.message || "עדכון נכשל");
        return;
      }
      await onSaved?.(data?.updateSong);
      onClose?.();
    } catch {
      setErr("לא ניתן להתחבר לשרת.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(open && song)} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>עדכון שיר</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="כותרת" value={title} onChange={e => setTitle(e.target.value)} fullWidth required />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              תמונת שיר
            </Typography>
            <Stack direction="row" spacing={2} alignItems="flex-start" flexWrap="wrap" useFlexGap>
              <SongCoverImage song={{ coverImageUrl }} height={100} sx={{ width: 160, borderRadius: 2 }} />
              <Stack spacing={1}>
                <Button component="label" variant="outlined" disabled={saving || coverUploading}>
                  {coverUploading ? "מעלה…" : "העלאת תמונה"}
                  <input
                    type="file"
                    hidden
                    accept={COVER_FILE_ACCEPT}
                    onChange={onCoverFileSelected}
                  />
                </Button>
                {coverImageUrl ? (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => setCoverImageUrl("")}
                    disabled={saving || coverUploading}
                  >
                    הסרת תמונה
                  </Button>
                ) : null}
                {!coverImageUrl && hadCoverOnOpen ? (
                  <Typography variant="caption" color="warning.main" display="block">
                    התמונה תוסר מהשיר לאחר לחיצה על «שמירה».
                  </Typography>
                ) : null}
                <Typography variant="caption" color="text.secondary" display="block">
                  JPG, PNG, WebP, GIF, BMP, HEIC — כולל מהתיקייה «הורדות»
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <TextField label="אמן" value={artist} onChange={e => setArtist(e.target.value)} fullWidth required />
          <TextField
            label="מילים"
            value={lyrics}
            onChange={e => setLyrics(e.target.value)}
            fullWidth
            required
            multiline
            minRows={4}
          />
          <TextField
            label="קישור לשיר (URL)"
            value={songUrl}
            onChange={e => setSongUrl(e.target.value)}
            fullWidth
            required
            helperText="אפשר להדביק קישור או להעלות קובץ — הקובץ יישמר בשרת תחת uploads"
          />
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              component="label"
              variant="outlined"
              disabled={saving || audioUploading}
              sx={{ cursor: audioUploading ? "wait" : "pointer" }}
            >
              העלאת קובץ אודיו
              <input
                type="file"
                hidden
                accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.webm,.flac"
                onChange={onAudioFileSelected}
              />
            </Button>
            {audioUploading ? (
              <Typography variant="body2" color="text.secondary">
                מעלה…
              </Typography>
            ) : null}
          </Stack>
          <TextField
            label="משך (דקות:שניות)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            type="text"
            fullWidth
            required
            placeholder="3:45"
            helperText="לדוגמה 3:45 — או מספר שניות בלבד (90)"
            inputProps={{ inputMode: "numeric", pattern: "[0-9:]*" }}
          />
          <FormControl fullWidth required disabled={loadingCats}>
            <InputLabel id="song-edit-cats">קטגוריות</InputLabel>
            <Select
              labelId="song-edit-cats"
              multiple
              value={categoryIds}
              onChange={e => {
                const v = e.target.value;
                setCategoryIds(typeof v === "string" ? v.split(",") : v);
              }}
              input={<OutlinedInput label="קטגוריות" />}
              renderValue={selected => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map(id => {
                    const c = categories.find(x => String(x._id) === String(id));
                    return <Chip key={id} size="small" label={c?.categoryName || id} />;
                  })}
                </Box>
              )}
            >
              {categories.map(c => (
                <MenuItem key={c._id} value={String(c._id)}>
                  {c.categoryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {err ? <Alert severity="error">{err}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          ביטול
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || audioUploading || coverUploading}>
          שמירה
        </Button>
      </DialogActions>
    </Dialog>
  );
}
