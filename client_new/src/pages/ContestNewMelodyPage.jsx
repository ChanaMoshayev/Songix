import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiOrigin } from "../utils/apiBase.js";
import NativeAudioPlayer from "../components/NativeAudioPlayer.jsx";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const LS_USER_PROFILE_KEY = "userProfile";

function safeParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getCurrentUsername() {
  const profile = safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
  return profile?.username ? String(profile.username) : "אורח";
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed reading file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export default function ContestNewMelodyPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [readingFile, setReadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return title.trim().length >= 2 && Boolean(audioDataUrl) && !readingFile && !saving;
  }, [title, audioDataUrl, readingFile, saving]);

  async function handlePickAudio(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setReadingFile(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setAudioDataUrl(dataUrl);
    } catch {
      setError("לא הצלחתי לקרוא את קובץ האודיו. נסי קובץ אחר.");
    } finally {
      setReadingFile(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("מלאי שם ללחן (לפחות 2 תווים) והעלי קובץ אודיו.");
      return;
    }

    const profile = safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
    const payload = {
      type: "melody",
      title: title.trim(),
      melodyAudioDataUrl: audioDataUrl,
      notes: notes.trim() || undefined,
      author: getCurrentUsername(),
      authorUserId: profile?.userId || undefined,
      authorEmail: profile?.email ? String(profile.email).trim().toLowerCase() : undefined,
    };

    setSaving(true);
    try {
      const res = await fetch(`${apiOrigin()}/contest-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "שגיאה בשמירת ההגשה.");
        return;
      }
      navigate("/contest", { replace: true });
    } catch {
      setError("לא ניתן להתחבר לשרת.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container sx={{ mt: { xs: 2, sm: 4 }, mb: { xs: 4, sm: 6 } }} maxWidth="md">
      <Paper sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, direction: "rtl" }}>
        <Stack spacing={0.75}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            העלאת לחן לתחרות
          </Typography>
          <Typography color="text.secondary">
            תני שם ללחן והעלי קובץ אודיו — אין צורך לבחור שיר מהמערכת.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="שם הלחן"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              fullWidth
              disabled={readingFile || saving}
              helperText="למשל: לחן גרסה אקוסטית"
            />

            <Button variant="outlined" component="label" disabled={readingFile || saving}>
              העלאת קובץ לחן (אודיו)
              <input hidden accept="audio/*" type="file" onChange={handlePickAudio} />
            </Button>

            {audioDataUrl ? <NativeAudioPlayer src={audioDataUrl} resolve={false} /> : null}

            <TextField
              label="הערות (אופציונלי)"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              fullWidth
              disabled={readingFile || saving}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button type="submit" variant="contained" disabled={!canSubmit}>
                {saving ? "שומר…" : "הוספת הלחן לתחרות"}
              </Button>
              <Button variant="outlined" onClick={() => navigate("/contest")}>
                חזרה לתחרות
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}
