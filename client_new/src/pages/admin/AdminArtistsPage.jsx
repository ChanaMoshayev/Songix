import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  deleteArtist,
  fetchArtists,
  removeArtistAvatar,
  saveArtist,
  uploadArtistAvatar,
} from "../../utils/artistsApi.js";
import { readPublisherObjectIdFromProfile } from "../../utils/readPublisherIdFromProfile.js";
import { readUserProfile } from "../../utils/songPermissions.js";
import {
  COVER_FILE_ACCEPT,
  coverFileRejectMessage,
  isAllowedCoverImageFile,
} from "../../utils/coverImageFile.js";
import { resolveUploadUrl } from "../../utils/mediaUrl.js";
import { artistInitials, artistAccentHue } from "../../utils/songArtists.js";
import ResponsiveTable from "../../components/ResponsiveTable.jsx";

export default function AdminArtistsPage() {
  const profile = readUserProfile();
  const adminUserId = readPublisherObjectIdFromProfile(profile);

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listErr, setListErr] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [formOk, setFormOk] = useState("");

  const [editingName, setEditingName] = useState(null);
  const [rowUploading, setRowUploading] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setListErr("");
    try {
      setArtists(await fetchArtists());
    } catch (e) {
      setArtists([]);
      setListErr(e?.message || "לא ניתן לטעון זמרים");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onFormImageSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!displayName.trim()) {
      setFormErr("כתבי קודם שם זמר/ת ואז העלי תמונה.");
      return;
    }
    if (!isAllowedCoverImageFile(file)) {
      setFormErr(coverFileRejectMessage(file));
      return;
    }
    if (!adminUserId) {
      setFormErr("אין הרשאת מנהל.");
      return;
    }
    setFormErr("");
    setImageUploading(true);
    try {
      const data = await uploadArtistAvatar(displayName.trim(), adminUserId, file);
      setPendingImageUrl(data?.artist?.profileImageUrl || "");
      setFormOk("התמונה הועלתה — לחצי «שמירת זמר» לסיום.");
    } catch (ex) {
      setFormErr(ex?.message || "העלאה נכשלה");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSaveArtist(e) {
    e.preventDefault();
    setFormErr("");
    setFormOk("");
    if (!adminUserId) {
      setFormErr("אין הרשאת מנהל.");
      return;
    }
    const name = displayName.trim();
    if (!name) {
      setFormErr("מלאי שם זמר/ת.");
      return;
    }
    setSubmitting(true);
    try {
      await saveArtist(adminUserId, name, pendingImageUrl || undefined);
      setFormOk(editingName ? "הזמר עודכן." : "הזמר נוסף.");
      setDisplayName("");
      setPendingImageUrl("");
      setEditingName(null);
      await load();
    } catch (ex) {
      setFormErr(ex?.message || "שמירה נכשלה");
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(artist) {
    setEditingName(artist.name);
    setDisplayName(artist.name);
    setPendingImageUrl(artist.profileImageUrl || "");
    setFormErr("");
    setFormOk("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingName(null);
    setDisplayName("");
    setPendingImageUrl("");
    setFormErr("");
    setFormOk("");
  }

  async function onRowImage(artist, file) {
    if (!file || !adminUserId) return;
    if (!isAllowedCoverImageFile(file)) {
      setListErr(coverFileRejectMessage(file));
      return;
    }
    setRowUploading(artist.nameKey);
    setListErr("");
    try {
      await uploadArtistAvatar(artist.name, adminUserId, file);
      await load();
    } catch (ex) {
      setListErr(ex?.message || "העלאה נכשלה");
    } finally {
      setRowUploading("");
    }
  }

  async function onRowRemoveImage(artist) {
    if (!adminUserId || !artist.profileImageUrl) return;
    setRowUploading(artist.nameKey);
    try {
      await removeArtistAvatar(artist.name, adminUserId);
      await load();
    } catch (ex) {
      setListErr(ex?.message || "הסרה נכשלה");
    } finally {
      setRowUploading("");
    }
  }

  async function onRowDelete(artist) {
    if (!adminUserId) {
      setListErr("אין הרשאת מנהל — התחברי מחדש.");
      return;
    }
    const ok = window.confirm(`להסיר את «${artist.name}» מרשימת הזמרים? השירים במערכת לא יימחקו.`);
    if (!ok) return;
    setRowUploading(artist.nameKey);
    setListErr("");
    setFormOk("");
    try {
      await deleteArtist({
        id: artist.id,
        displayName: artist.name,
        nameKey: artist.nameKey,
        adminUserId,
      });
      setArtists(prev => prev.filter(a => String(a.id) !== String(artist.id)));
      if (editingName === artist.name) cancelEdit();
      setFormOk(`«${artist.name}» הוסר מהרשימה.`);
    } catch (ex) {
      setListErr(ex?.message || "מחיקה נכשלה");
      await load();
    } finally {
      setRowUploading("");
    }
  }

  const previewSrc = resolveUploadUrl(pendingImageUrl);
  const previewHue = artistAccentHue(displayName);

  return (
    <Stack spacing={2} sx={{ direction: "rtl" }}>
      <Typography variant="h4" sx={{ fontWeight: 900 }}>
        ניהול זמרים
      </Typography>
      <Typography color="text.secondary">
        רק זמרים שנשמרים כאן מופיעים בטבלה ובפס «זמרים במערכת» (אחרי «שמירת זמר» + תמונה). לא נמשכים אוטומטית משירים.
      </Typography>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          {editingName ? `עריכת זמר: ${editingName}` : "הוספת זמר / תמונת פרופיל"}
        </Typography>
        <Box component="form" onSubmit={handleSaveArtist}>
          <Stack spacing={2}>
            {formErr ? <Alert severity="error">{formErr}</Alert> : null}
            {formOk ? <Alert severity="success">{formOk}</Alert> : null}

            <TextField
              label="שם הזמר/ת"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              fullWidth
              required
              helperText="שם ייחודי — אחד לכל זמר במערכת"
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <Avatar
                src={previewSrc || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: previewSrc ? "grey.300" : `hsl(${previewHue} 52% 42%)`,
                  fontSize: "1.5rem",
                }}
              >
                {!previewSrc ? artistInitials(displayName || "?") : null}
              </Avatar>
              <Stack spacing={1}>
                <Button component="label" variant="outlined" disabled={imageUploading || submitting}>
                  {imageUploading ? "מעלה…" : "העלאת תמונת פרופיל"}
                  <input type="file" hidden accept={COVER_FILE_ACCEPT} onChange={onFormImageSelected} />
                </Button>
                {pendingImageUrl ? (
                  <Button size="small" onClick={() => setPendingImageUrl("")}>
                    הסרת תמונה מהטופס
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button type="submit" variant="contained" disabled={submitting || imageUploading}>
                {submitting ? <CircularProgress size={22} color="inherit" /> : "שמירת זמר"}
              </Button>
              {editingName ? (
                <Button type="button" variant="outlined" onClick={cancelEdit}>
                  ביטול עריכה
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
          כל הזמרים
        </Typography>
        {listErr ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {listErr}
          </Alert>
        ) : null}
        <Divider sx={{ mb: 2 }} />
        {loading ? (
          <CircularProgress size={32} />
        ) : artists.length === 0 ? (
          <Alert severity="info">אין זמרים בטבלה. הוסיפי זמר/ת למעלה ולחצי «שמירת זמר».</Alert>
        ) : (
          <ResponsiveTable tableProps={{ size: "small" }}>
            <TableHead>
              <TableRow>
                <TableCell>תמונה</TableCell>
                <TableCell>שם</TableCell>
                <TableCell>שירים במערכת</TableCell>
                <TableCell align="left">פעולות</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {artists.map(a => {
                const src = resolveUploadUrl(a.profileImageUrl);
                const busy = rowUploading === a.nameKey;
                return (
                  <TableRow key={a.nameKey}>
                    <TableCell>
                      <Avatar src={src || undefined} sx={{ width: 48, height: 48 }}>
                        {!src ? artistInitials(a.name) : null}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{a.name}</TableCell>
                    <TableCell>{a.songCount}</TableCell>
                    <TableCell align="left">
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button size="small" variant="outlined" onClick={() => startEdit(a)}>
                          עריכה
                        </Button>
                        <Button component="label" size="small" variant="outlined" disabled={busy}>
                          {busy ? "…" : "תמונה"}
                          <input
                            type="file"
                            hidden
                            accept={COVER_FILE_ACCEPT}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              e.target.value = "";
                              if (f) onRowImage(a, f);
                            }}
                          />
                        </Button>
                        {a.profileImageUrl ? (
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            disabled={busy}
                            onClick={() => onRowRemoveImage(a)}
                          >
                            הסר תמונה
                          </Button>
                        ) : null}
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          disabled={busy}
                          onClick={() => onRowDelete(a)}
                        >
                          {busy ? "…" : "מחיקה"}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </ResponsiveTable>
        )}
      </Paper>
    </Stack>
  );
}
