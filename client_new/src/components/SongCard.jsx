// components/SongCard.jsx
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import SongAudioPlayer from "./SongAudioPlayer.jsx";
import { isMelodyCatalogSong } from "../utils/songContentType.js";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/MyContext.jsx";
import { readUserProfile, canManageSong } from "../utils/songPermissions.js";
import { displaySongArtist } from "../utils/deriveArtistFromSongUrl.js";
import SongEditDialog from "./SongEditDialog.jsx";
import FavoriteButton from "./FavoriteButton.jsx";
import SongCoverImage from "./SongCoverImage.jsx";
import { apiOrigin } from "../utils/apiBase.js";

export default function SongCard({ song, navigateWithAudioAutoplay = false }) {
  const navigate = useNavigate();
  const { refreshSongs } = useAppContext();
  const profile = useMemo(() => readUserProfile(), []);
  const canManage = useMemo(() => canManageSong(profile, song), [profile, song]);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMelody = isMelodyCatalogSong(song);
  const hasAudio = Boolean(String(song?.songUrl || "").trim());
  async function confirmDelete() {
    if (!song?._id) return;
    setDeleting(true);
    try {
      const res = await fetch(`${apiOrigin()}/songs/${song._id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // eslint-disable-next-line no-alert
        alert(typeof data === "string" ? data : data?.message || "מחיקה נכשלה");
        return;
      }
      setDeleteOpen(false);
      await refreshSongs();
    } catch {
      // eslint-disable-next-line no-alert
      alert("לא ניתן להתחבר לשרת.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card
        sx={{
          width: "100%",
          height: "100%",
          minHeight: { xs: 300, sm: 320 },
          display: "flex",
          flexDirection: "column",
          overflow: "visible",
          borderRadius: 2.5,
          boxShadow: "0 2px 12px rgba(15, 23, 42, 0.08)",
          "&:hover .song-card-title": { color: "primary.main" },
        }}
      >
        <CardActionArea
          component="div"
          onClick={() => {
            navigate(`/songs/${song._id}`, {
              state: navigateWithAudioAutoplay ? { autoPlayAudio: true } : undefined,
            });
          }}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            alignSelf: "stretch",
          }}
        >
          <SongCoverImage song={song} height={180} sx={{ flexShrink: 0 }} />
          <CardContent
            sx={{
              textAlign: "right",
              direction: "rtl",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              width: "100%",
              py: 1.75,
              "&:last-child": { pb: 1.75 },
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
              spacing={1}
              sx={{ width: "100%" }}
            >
              <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  className="song-card-title"
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    transition: "color 0.2s",
                    flex: 1,
                    fontSize: "1.05rem",
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    minHeight: "2.7em",
                  }}
                >
                  {song.title}
                </Typography>
                {isMelody ? <Chip size="small" label="לחן" color="secondary" sx={{ flexShrink: 0 }} /> : null}
              </Stack>
              <FavoriteButton songId={song._id} size="small" showLabel={false} />
            </Stack>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.75,
                display: "-webkit-box",
                WebkitLineClamp: 1,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {displaySongArtist(song)}
            </Typography>
          </CardContent>
        </CardActionArea>
        {hasAudio ? (
          <Box sx={{ px: 2, pb: 1.5, pt: 0.5, flexShrink: 0 }}>
            <SongAudioPlayer songId={song._id} songUrl={song.songUrl} />
          </Box>
        ) : null}
        <CardActions
          sx={{
            justifyContent: "flex-end",
            px: 2,
            py: 1.25,
            gap: 1,
            flexWrap: "wrap",
            minHeight: 52,
            mt: "auto",
            visibility: canManage ? "visible" : "hidden",
          }}
        >
          {canManage ? (
            <>
              <Button size="small" variant="outlined" onClick={() => setEditOpen(true)}>
                עדכון
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
                מחיקה
              </Button>
            </>
          ) : (
            <Box sx={{ height: 32 }} aria-hidden />
          )}
        </CardActions>
      </Card>

      <SongEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        song={song}
        onSaved={async () => {
          await refreshSongs();
        }}
      />

      <Dialog open={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} dir="rtl">
        <DialogTitle>מחיקת שיר</DialogTitle>
        <DialogContent>
          <DialogContentText>למחוק את «{song.title}»? פעולה זו לא ניתנת לביטול.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>
            ביטול
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "מוחק…" : "מחיקה"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
