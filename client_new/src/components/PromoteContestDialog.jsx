import { useEffect, useState } from "react";
import {
  Alert,
  Button,
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
import { apiPath, uploadSongAudioFile } from "../utils/apiBase.js";
import { promoteContestSubmission } from "../utils/contestApi.js";
import { parseDurationToSeconds, formatDurationMmSs } from "../utils/formatDuration.js";
import { readUserProfile } from "../utils/songPermissions.js";

export default function PromoteContestDialog({ open, submission, onClose, onPromoted }) {
  const [artist, setArtist] = useState("");
  const [duration, setDuration] = useState("3:00");
  const [songUrl, setSongUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lyricsOverride, setLyricsOverride] = useState("");
  const [titleOverride, setTitleOverride] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [audioUploading, setAudioUploading] = useState(false);
  const isLyrics = submission?.type === "lyrics";
  const isMelody = submission?.type === "melody";

  useEffect(() => {
    if (!open || !submission) return;
    setArtist(String(submission.author || ""));
    setDuration("3:00");
    setSongUrl("");
    setCategoryIds([]);
    setLyricsOverride(String(submission.lyrics || submission.notes || ""));
    setTitleOverride(String(submission.title || ""));
    setErr("");
  }, [open, submission]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(apiPath("/categories"));
        const data = await res.json().catch(() => []);
        if (!cancelled && res.ok && Array.isArray(data)) setCategories(data);
      } catch {
        if (!cancelled) setCategories([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function onAudioFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAudioUploading(true);
    setErr("");
    const out = await uploadSongAudioFile(file);
    setAudioUploading(false);
    if (!out.ok) {
      setErr(out.message || "העלאה נכשלה");
      return;
    }
    setSongUrl(out.songUrl);
  }

  async function handlePromote() {
    const profile = readUserProfile();
    if (profile?.status !== "admin" || !profile?.userId) {
      setErr("רק מנהל יכול להוסיף שיר למערכת.");
      return;
    }
    const dur = parseDurationToSeconds(duration);
    if (!artist.trim()) {
      setErr("מלאי שם אמן.");
      return;
    }
    if (!Number.isFinite(dur) || dur <= 0) {
      setErr("משך לא תקין (למשל 3:45).");
      return;
    }
    if (categoryIds.length === 0) {
      setErr("בחרי לפחות קטגוריה אחת.");
      return;
    }
    if (isLyrics && !songUrl.trim()) {
      setErr("העלי קובץ שיר או הדביקי קישור לפני הפרסום במערכת.");
      return;
    }

    setSaving(true);
    setErr("");
    try {
      await promoteContestSubmission(submission._id, {
        adminUserId: profile.userId,
        artist: artist.trim(),
        duration: dur,
        categoryIds,
        songUrl: songUrl.trim() || undefined,
        title: isMelody ? titleOverride.trim() : undefined,
        lyrics: isMelody ? lyricsOverride.trim() : undefined,
      });
      await onPromoted?.();
      onClose?.();
    } catch (e) {
      setErr(e?.message || "הוספה למערכת נכשלה");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(open && submission)} onClose={onClose} fullWidth maxWidth="sm" dir="rtl">
      <DialogTitle>הוספת שיר למערכת</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            השיר יופיע בעמוד השירים ויוסר מרשימת התחרות.
          </Typography>
          {err ? <Alert severity="error">{err}</Alert> : null}
          {isMelody ? (
            <TextField
              label="כותרת השיר במערכת"
              value={titleOverride}
              onChange={e => setTitleOverride(e.target.value)}
              fullWidth
            />
          ) : null}
          <TextField label="אמן" value={artist} onChange={e => setArtist(e.target.value)} fullWidth required />
          {isMelody ? (
            <TextField
              label="מילים (במערכת)"
              value={lyricsOverride}
              onChange={e => setLyricsOverride(e.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          ) : null}
          <TextField
            label="משך (דקות:שניות)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="3:45"
            fullWidth
            helperText={`לדוגמה ${formatDurationMmSs(180)}`}
          />
          <FormControl fullWidth>
            <InputLabel>קטגוריות</InputLabel>
            <Select
              multiple
              value={categoryIds}
              onChange={e => setCategoryIds(typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value)}
              input={<OutlinedInput label="קטגוריות" />}
            >
              {categories.map(c => (
                <MenuItem key={c._id} value={String(c._id)}>
                  {c.categoryName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(isLyrics || isMelody) && (
            <>
              <TextField
                label="קישור לקובץ שיר"
                value={songUrl}
                onChange={e => setSongUrl(e.target.value)}
                fullWidth
                helperText={isMelody ? "אופציונלי אם הלחן כבר נשמר מההגשה" : "חובה לפני פרסום"}
              />
              <Button component="label" variant="outlined" disabled={saving || audioUploading}>
                העלאת קובץ אודיו
                <input type="file" hidden accept="audio/*" onChange={onAudioFileSelected} />
              </Button>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          ביטול
        </Button>
        <Button variant="contained" onClick={handlePromote} disabled={saving || audioUploading}>
          {saving ? "מוסיף…" : "הוספה למערכת"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
