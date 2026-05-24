import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import LyricsRoundedIcon from "@mui/icons-material/LyricsRounded";

const PREVIEW_LINES = 6;
const PREVIEW_CHARS = 320;

function previewText(lyrics) {
  const text = String(lyrics || "").trim();
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  if (lines.length <= PREVIEW_LINES && text.length <= PREVIEW_CHARS) return text;
  const byLines = lines.slice(0, PREVIEW_LINES).join("\n");
  if (byLines.length >= PREVIEW_CHARS) {
    return `${byLines.slice(0, PREVIEW_CHARS)}…`;
  }
  return `${byLines}…`;
}

export default function ContestLyricsViewer({ title, lyrics, compact = false }) {
  const [open, setOpen] = useState(false);
  const full = String(lyrics || "").trim();
  if (!full) {
    return (
      <Typography variant="body2" color="text.secondary">
        אין מילים להצגה.
      </Typography>
    );
  }

  const needsDialog = full.length > PREVIEW_CHARS || full.split(/\r?\n/).length > PREVIEW_LINES;

  return (
    <Box sx={{ mt: compact ? 0 : 1.5 }}>
      <Typography
        variant="body2"
        sx={{
          whiteSpace: "pre-line",
          bgcolor: "grey.50",
          p: 1.5,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          maxHeight: compact ? 140 : 200,
          overflow: "auto",
        }}
      >
        {needsDialog ? previewText(full) : full}
      </Typography>
      {needsDialog ? (
        <Button
          size="small"
          startIcon={<LyricsRoundedIcon />}
          onClick={() => setOpen(true)}
          sx={{ mt: 1, px: 0 }}
        >
          צפייה במילים המלאות
        </Button>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" dir="rtl">
        <DialogTitle sx={{ fontWeight: 800 }}>{title ? `מילים — ${title}` : "מילי השיר"}</DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ whiteSpace: "pre-line", lineHeight: 1.75 }}>{full}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>סגירה</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
