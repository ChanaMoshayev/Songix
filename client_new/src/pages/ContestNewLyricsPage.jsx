import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/MyContext.jsx";
import { apiOrigin } from "../utils/apiBase.js";
import { Alert, Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";

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

export default function ContestNewLyricsPage() {
  const navigate = useNavigate();
  const { loading } = useAppContext();

  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return title.trim().length >= 2 && lyrics.trim().length >= 10 && !loading && !saving;
  }, [title, lyrics, loading, saving]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("מלאי כותרת ומילים (לפחות 10 תווים) כדי להעלות לתחרות.");
      return;
    }

    const profile = safeParseJson(localStorage.getItem(LS_USER_PROFILE_KEY), null);
    const payload = {
      type: "lyrics",
      title: title.trim(),
      lyrics: lyrics.trim(),
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
            העלאת שיר חדש (מילים)
          </Typography>
          <Typography color="text.secondary">
            כתבי מילים לשיר חדש והעלי אותו לתחרות.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            <TextField
              label="שם השיר"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              disabled={loading || saving}
            />

            <TextField
              label="מילות השיר"
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              fullWidth
              required
              disabled={loading || saving}
              multiline
              minRows={8}
            />

            {error && <Alert severity="error">{error}</Alert>}

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button type="submit" variant="contained" disabled={!canSubmit}>
                {saving ? "שומר…" : "העלאה לתחרות"}
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

