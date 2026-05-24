import { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../context/MyContext.jsx";
import SongEditDialog from "../../components/SongEditDialog.jsx";
import { apiPath, fetchJson, uploadSongAudioFile, uploadSongCoverFile } from "../../utils/apiBase.js";
import {
  COVER_FILE_ACCEPT,
  coverFileRejectMessage,
  isAllowedCoverImageFile,
} from "../../utils/coverImageFile.js";
import SongCoverImage from "../../components/SongCoverImage.jsx";
import ResponsiveTable from "../../components/ResponsiveTable.jsx";
import { getSongCategoryIds } from "../../utils/songCategories.js";
import { displaySongArtist } from "../../utils/deriveArtistFromSongUrl.js";
import { formatDurationMmSs, parseDurationToSeconds } from "../../utils/formatDuration.js";
import { readPublisherObjectIdFromProfile } from "../../utils/readPublisherIdFromProfile.js";
import { readStoredProfile } from "../../utils/authSession.js";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

export default function AdminSongsPage() {
  const { songs, loading, error, refreshSongs } = useAppContext();
  const profile = useMemo(() => readStoredProfile(), []);

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catError, setCatError] = useState("");

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [songUrl, setSongUrl] = useState("");
  const [categoryIds, setCategoryIds] = useState([]);
  const [duration, setDuration] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formOk, setFormOk] = useState("");
  const [audioUploading, setAudioUploading] = useState(false);
  const [editSong, setEditSong] = useState(null);
  const [deleteSong, setDeleteSong] = useState(null);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCatLoading(true);
      setCatError("");
      try {
        const res = await fetch(apiPath("/categories"));
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setCatError(data?.message || `שגיאה בטעינת קטגוריות (${res.status})`);
          setCategories([]);
        } else if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCatError("תשובה לא תקינה מהשרת.");
          setCategories([]);
        }
      } catch {
        if (!cancelled) {
          setCatError("לא ניתן להתחבר לשרת — בדקי שהשרת רץ על פורט 5000.");
          setCategories([]);
        }
      } finally {
        if (!cancelled) setCatLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** הודעות הצלחה נעלמות אוטומטית אחרי כמה שניות */
  useEffect(() => {
    if (!formOk) return;
    const t = setTimeout(() => setFormOk(""), 4500);
    return () => clearTimeout(t);
  }, [formOk]);

  const publisherId = readPublisherObjectIdFromProfile(profile);
  const parsedDuration = parseDurationToSeconds(duration);
  const canAdd =
    Boolean(publisherId) &&
    title.trim() &&
    artist.trim() &&
    lyrics.trim() &&
    songUrl.trim() &&
    categoryIds.length > 0 &&
    Number.isFinite(parsedDuration) &&
    parsedDuration > 0 &&
    !audioUploading &&
    !coverUploading;

  async function handleAddSong(e) {
    e.preventDefault();
    setFormError("");
    setFormOk("");
    if (!publisherId) {
      setFormError("חסר מזהה משתמש — התחברי מחדש.");
      return;
    }
    const dur = parseDurationToSeconds(duration);
    if (!Number.isFinite(dur) || dur <= 0) {
      setFormError("משך לא תקין. השתמשי בדקות:שניות (למשל 3:45) או מספר שניות.");
      return;
    }

    setSubmitting(true);
    try {
      const { res, data } = await fetchJson("/songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          artist: artist.trim(),
          lyrics: lyrics.trim(),
          songUrl: songUrl.trim(),
          categoryIds,
          publisherId,
          duration: dur,
          ...(coverImageUrl.trim() ? { coverImageUrl: coverImageUrl.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : data?.message || (res.status === 500 ? `שגיאת שרת (${res.status})` : `שגיאה (${res.status})`);
        setFormError(msg);
        return;
      }
      setFormOk("השיר נוסף בהצלחה.");
      setTitle("");
      setArtist("");
      setLyrics("");
      setSongUrl("");
      setCategoryIds([]);
      setDuration("");
      setCoverImageUrl("");
      await refreshSongs();
    } catch {
      setFormError("לא ניתן להתחבר לשרת.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onCoverFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!isAllowedCoverImageFile(file)) {
      setFormError(coverFileRejectMessage(file));
      return;
    }
    setFormError("");
    setCoverUploading(true);
    const out = await uploadSongCoverFile(file);
    setCoverUploading(false);
    if (!out.ok) {
      setFormError(out.message || "העלאת תמונה נכשלה");
      return;
    }
    setCoverImageUrl(out.coverImageUrl);
  }

  async function onAudioFileSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFormError("");
    setAudioUploading(true);
    const out = await uploadSongAudioFile(file);
    setAudioUploading(false);
    if (!out.ok) {
      setFormError(out.message || "העלאה נכשלה");
      return;
    }
    setSongUrl(out.songUrl);
  }

  async function confirmDeleteSong() {
    if (!deleteSong?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/songs/${deleteSong._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(typeof data === "string" ? data : data?.message || "מחיקה נכשלה");
        return;
      }
      setDeleteSong(null);
      setFormOk("השיר נמחק.");
      await refreshSongs();
    } catch {
      setFormError("לא ניתן להתחבר לשרת.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          ניהול שירים
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          הוספת שיר חדש והצגת כל השירים במערכת.
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, direction: "rtl" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          הוספת שיר
        </Typography>
        <Box component="form" onSubmit={handleAddSong}>
          <Stack spacing={2}>
            {!publisherId ? (
              <Alert severity="warning">אין מזהה משתמש בפרופיל — לא ניתן לשייך שיר למפרסם.</Alert>
            ) : null}
            <TextField label="כותרת" value={title} onChange={e => setTitle(e.target.value)} fullWidth required />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                תמונת שיר (אופציונלי)
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                <SongCoverImage song={{ coverImageUrl }} height={120} sx={{ width: { xs: "100%", sm: 200 }, borderRadius: 2 }} />
                <Stack spacing={1}>
                  <Button
                    component="label"
                    variant="outlined"
                    disabled={submitting || coverUploading}
                  >
                    {coverUploading ? "מעלה תמונה…" : "העלאת תמונה"}
                    <input
                      type="file"
                      hidden
                      accept={COVER_FILE_ACCEPT}
                      onChange={onCoverFileSelected}
                    />
                  </Button>
                  {coverImageUrl ? (
                    <Button size="small" color="error" variant="outlined" onClick={() => setCoverImageUrl("")}>
                      הסרת תמונה
                    </Button>
                  ) : null}
                  <Typography variant="caption" color="text.secondary" display="block">
                    JPG, PNG, WebP, GIF, BMP, HEIC — כולל מהתיקייה «הורדות»
                  </Typography>
                </Stack>
              </Stack>
            </Box>
            <TextField
              label="אמן"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              fullWidth
              required
            />
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
              helperText="קישור חיצוני או העלאת קובץ אודיו מהמחשב."
            />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Button
                component="label"
                variant="outlined"
                disabled={submitting || audioUploading}
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
            {catError ? (
              <Alert severity="error">{catError}</Alert>
            ) : catLoading ? (
              <Typography variant="body2" color="text.secondary">טוען קטגוריות…</Typography>
            ) : categories.length === 0 ? (
              <Alert severity="warning">לא נמצאו קטגוריות במערכת — הוסיפי קטגוריות לפני הוספת שיר.</Alert>
            ) : (
              <FormControl fullWidth required>
                <InputLabel id="admin-add-cats">קטגוריות</InputLabel>
                <Select
                  labelId="admin-add-cats"
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
            )}
            {formError ? <Alert severity="error">{formError}</Alert> : null}
            {formOk ? <Alert severity="success">{formOk}</Alert> : null}
            <Button type="submit" variant="contained" disabled={!canAdd || submitting} sx={{ alignSelf: "flex-start" }}>
              {submitting ? <CircularProgress size={22} color="inherit" /> : "הוספת שיר"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, direction: "rtl" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          כל השירים
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <Typography>טוען…</Typography>
        ) : !Array.isArray(songs) || songs.length === 0 ? (
          <Alert severity="info">אין שירים להצגה.</Alert>
        ) : (
          <ResponsiveTable tableProps={{ size: "small" }}>
            <TableHead>
              <TableRow>
                <TableCell>כותרת</TableCell>
                <TableCell>אמן</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>מפרסם</TableCell>
                <TableCell>תמונה</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>משך</TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>תאריך</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {songs.map(s => (
                <TableRow key={s._id}>
                  <TableCell sx={{ fontWeight: 700 }}>{s.title}</TableCell>
                  <TableCell>{displaySongArtist(s)}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {String(s.publisherId)}
                  </TableCell>
                  <TableCell sx={{ width: 72 }}>
                    <SongCoverImage song={s} height={48} sx={{ width: 64, borderRadius: 1 }} />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                    {formatDurationMmSs(s.duration)}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    {s.uploadDate ? new Date(s.uploadDate).toLocaleDateString("he-IL") : "—"}
                  </TableCell>
                  <TableCell align="left">
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Button size="small" variant="outlined" onClick={() => setEditSong(s)}>
                        עדכון
                      </Button>
                      <Button size="small" variant="outlined" color="error" onClick={() => setDeleteSong(s)}>
                        מחיקה
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </ResponsiveTable>
        )}
      </Paper>

      <SongEditDialog
        open={Boolean(editSong)}
        onClose={() => setEditSong(null)}
        song={editSong}
        onSaved={async updated => {
          setFormOk("השיר עודכן.");
          if (updated?._id) setEditSong(updated);
          await refreshSongs();
        }}
      />

      <Dialog open={Boolean(deleteSong)} onClose={() => !deleting && setDeleteSong(null)} dir="rtl">
        <DialogTitle>מחיקת שיר</DialogTitle>
        <DialogContent>
          <DialogContentText>
            למחוק את «{deleteSong?.title}»? פעולה זו לא ניתנת לביטול.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteSong(null)} disabled={deleting}>
            ביטול
          </Button>
          <Button color="error" variant="contained" onClick={confirmDeleteSong} disabled={deleting}>
            {deleting ? "מוחק…" : "מחיקה"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
