import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ContestSubmissionRating from "./ContestSubmissionRating.jsx";
import ContestLyricsViewer from "./ContestLyricsViewer.jsx";
import ContestMelodyPlayer from "./ContestMelodyPlayer.jsx";
import { fetchContestStats, fetchContestSubmissions } from "../utils/contestApi.js";
import { readUserProfile } from "../utils/songPermissions.js";
import { readPublisherObjectIdFromProfile } from "../utils/readPublisherIdFromProfile.js";

function StatCard({ icon, label, value, accent }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        height: "100%",
        background: `linear-gradient(145deg, ${accent}18 0%, ${accent}08 100%)`,
        border: "1px solid",
        borderColor: `${accent}33`,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: `${accent}22`,
            color: accent,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            {value ?? "—"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function ContestBoard({ showAdminHint = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useMemo(() => readUserProfile(), [location.key]);
  const userId = useMemo(() => readPublisherObjectIdFromProfile(profile), [profile]);
  const profileForApi = useMemo(
    () => (profile ? { ...profile, userId: userId || profile.userId } : null),
    [profile, userId]
  );
  const isAdmin = profile?.status === "admin";

  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [st, list] = await Promise.all([
        fetchContestStats(),
        fetchContestSubmissions(profileForApi),
      ]);
      setStats(st);
      setSubmissions(list);
    } catch (e) {
      setStats(null);
      setSubmissions([]);
      setError(e?.message || "שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }, [profileForApi]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  function handleRated(submissionId, patch) {
    setSubmissions(prev =>
      prev.map(s => {
        if (String(s._id) !== String(submissionId)) return s;
        const next = { ...s, myStars: patch.myStars ?? s.myStars };
        if (isAdmin) {
          next.totalPoints = patch.totalPoints ?? s.totalPoints;
          next.ratingsCount = patch.ratingsCount ?? s.ratingsCount;
        }
        return next;
      })
    );
  }

  return (
    <Box sx={{ direction: "rtl" }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 4 },
          mb: 3,
          borderRadius: 4,
          color: "common.white",
          background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 40%, #db2777 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            top: -80,
            left: -40,
          }}
        />
        <Stack spacing={1} sx={{ position: "relative" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <EmojiEventsRoundedIcon sx={{ fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 900, fontSize: { xs: "1.35rem", sm: undefined } }}>
              תחרות השירים
            </Typography>
          </Stack>
          <Typography sx={{ opacity: 0.92, maxWidth: 560 }}>
            העלי מילים או לחן, ודרגי יצירות של אחרים.
          </Typography>
          {showAdminHint && isAdmin ? (
            <Chip
              label="מצב מנהל: סכום נקודות"
              size="small"
              sx={{ alignSelf: "flex-start", bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
            />
          ) : null}
        </Stack>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<LibraryMusicRoundedIcon />}
            label="שירים במערכת"
            value={stats?.publishedSongs}
            accent="#7c3aed"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<EmojiEventsRoundedIcon />}
            label="משתתפים בתחרות"
            value={stats?.activeSubmissions}
            accent="#db2777"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<PeopleRoundedIcon />}
            label="משתמשים רשומים"
            value={stats?.usersCount}
            accent="#2563eb"
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <StatCard
            icon={<StarRoundedIcon />}
            label="דירוגים שניתנו"
            value={stats?.ratingsCount}
            accent="#ea580c"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>מסלול מילים</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
              שיר חדש — מילים בלבד
            </Typography>
            <Button variant="contained" onClick={() => navigate("/contest/new-lyrics")}>
              העלאת מילים
            </Button>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography sx={{ fontWeight: 900, mb: 0.5 }}>מסלול לחן</Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 1.5 }}>
              העלאת לחן עצמאי לתחרות
            </Typography>
            <Button variant="contained" color="secondary" onClick={() => navigate("/contest/new-melody")}>
              העלאת לחן
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5 }}>
        משתתפים בתחרות
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        {isAdmin
          ? "למנהל: סכום הנקודות מכל הדירוגים. לשאר המשתמשים — דירוג בלבד."
          : "דרגי כל יצירה (1–5 כוכבים = נקודות). סכום הנקודות אינו מוצג לציבור."}
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}

      {loading ? (
        <Typography>טוען…</Typography>
      ) : submissions.length === 0 ? (
        <Alert severity="info">אין כרגע משתתפים פעילים בתחרות.</Alert>
      ) : (
        <Stack spacing={2}>
          {[...(isAdmin
            ? [...submissions].sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0))
            : submissions
          )].map((item, index) => {
            const isLyrics = item?.type === "lyrics";
            const isMelody = item?.type === "melody";
            const rowKey = item?._id;
            const createdLabel = item?.createdAt
              ? new Date(item.createdAt).toLocaleString("he-IL")
              : "";

            return (
              <Paper
                key={rowKey}
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: index === 0 && isAdmin ? "warning.light" : "divider",
                  background:
                    index === 0 && isAdmin
                      ? "linear-gradient(180deg, rgba(251,191,36,0.08) 0%, transparent 60%)"
                      : "background.paper",
                }}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "flex-start" }}
                  spacing={3}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
                      <Chip
                        label={isLyrics ? "מילים" : "לחן"}
                        size="small"
                        color={isLyrics ? "primary" : "secondary"}
                      />
                      {index === 0 && isAdmin && (item.totalPoints ?? 0) > 0 ? (
                        <Chip icon={<EmojiEventsRoundedIcon />} label="מוביל" size="small" color="warning" />
                      ) : null}
                      <Typography variant="h6" sx={{ fontWeight: 900 }}>
                        {isLyrics ? item.title : item.title || "לחן"}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 0.75 }}>
                      {item.author || "אורח"}
                      {createdLabel ? ` · ${createdLabel}` : ""}
                    </Typography>

                    {isAdmin ? (
                      <Chip
                        label={`סה״כ נקודות (מנהל): ${item.totalPoints ?? 0} · ${item.ratingsCount ?? 0} דירוגים`}
                        sx={{ mt: 1.25, fontWeight: 700 }}
                        color="warning"
                        variant="outlined"
                      />
                    ) : null}

                    {isLyrics ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
                          מילי השיר
                        </Typography>
                        <ContestLyricsViewer title={item.title} lyrics={item.lyrics} />
                      </Box>
                    ) : null}

                    {isMelody ? (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75 }}>
                          האזנה ללחן
                        </Typography>
                        <ContestMelodyPlayer submission={item} />
                      </Box>
                    ) : null}
                  </Box>

                  {rowKey ? (
                    <Box sx={{ flexShrink: 0, pt: { xs: 1, sm: 0 } }}>
                      <ContestSubmissionRating
                        submissionId={String(rowKey)}
                        myStars={item.myStars || 0}
                        onRated={handleRated}
                        alignSide
                      />
                    </Box>
                  ) : null}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

    </Box>
  );
}
