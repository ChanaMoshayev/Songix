import { useEffect, useState } from "react";
import { Alert, Box, Rating, Typography } from "@mui/material";
import { rateContestSubmission } from "../utils/contestApi.js";
import { readUserProfile } from "../utils/songPermissions.js";

/** דירוג הגשת תחרות — נשמר בשרת; סכום נקודות רק למנהל (מוצג בכרטיס ההורה) */
export default function ContestSubmissionRating({ submissionId, myStars = 0, onRated, alignSide = false }) {
  const id = String(submissionId || "").trim();
  const [value, setValue] = useState(myStars);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setValue(myStars);
  }, [myStars, id]);

  if (!id) return null;

  const profile = readUserProfile();
  const canRate = Boolean(profile?.userId);

  const handleChange = async (_event, newValue) => {
    if (!newValue) return;
    setValue(newValue);
    setErr("");

    if (!canRate) {
      setErr("יש להתחבר כדי לדרג.");
      setValue(myStars);
      return;
    }

    setSaving(true);
    try {
      const data = await rateContestSubmission(id, profile.userId, newValue);
      onRated?.(id, { myStars: data.myStars ?? newValue, totalPoints: data.totalPoints, ratingsCount: data.ratingsCount });
    } catch (e) {
      setErr(e?.message || "שמירה נכשלה");
      setValue(myStars);
    } finally {
      setSaving(false);
    }
  };

  const stars = (
    <Box dir="ltr" sx={{ display: "inline-flex", flexDirection: "row", alignItems: "center" }}>
      <Rating
        name={`contest-submission-${id}`}
        value={value}
        onChange={handleChange}
        disabled={saving || !canRate}
        size="large"
      />
    </Box>
  );

  return (
    <Box
      sx={
        alignSide
          ? {
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              minWidth: { sm: 168 },
            }
          : { mt: 1.5 }
      }
    >
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, mb: 0.5 }}>
        דרג את ההגשה:
      </Typography>
      {!canRate ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 220, mb: 0.5 }}>
          התחברי כדי לדרג (1–5 כוכבים).
        </Typography>
      ) : null}
      {canRate ? stars : null}
      {value > 0 && canRate ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          דירוג נוכחי: {value} כוכבים
        </Typography>
      ) : null}
      {saving ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          שומר…
        </Typography>
      ) : null}
      {err ? (
        <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
          {err}
        </Alert>
      ) : null}
    </Box>
  );
}
