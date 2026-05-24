import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { readUserProfile } from "../utils/songPermissions.js";

const LS_COMMENTS_KEY = "songComments";

function safeParseJson(raw, fallback) {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function formatCommentTime(date) {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return "";
  }
}

function authorInitial(name) {
  const ch = String(name || "?").trim().charAt(0);
  return ch || "?";
}

export default function CommentsSection({ songId }) {
  const profile = readUserProfile();
  const authorName = profile?.username || profile?.email || "אורח";

  const [comments, setComments] = useState(() => safeParseJson(localStorage.getItem(LS_COMMENTS_KEY), {}));
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    setCommentsOpen(false);
  }, [songId]);

  useEffect(() => {
    localStorage.setItem(LS_COMMENTS_KEY, JSON.stringify(comments));
  }, [comments]);

  const songComments = useMemo(() => {
    const list = comments[songId] || [];
    return [...list].reverse();
  }, [comments, songId]);

  function handleAddComment() {
    const text = newComment.trim();
    if (!text) return;

    setSubmitting(true);
    setComments(prev => ({
      ...prev,
      [songId]: [
        ...(prev[songId] || []),
        {
          text,
          date: new Date().toISOString(),
          author: authorName,
        },
      ],
    }));
    setNewComment("");
    setSubmitting(false);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 4,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        direction: "rtl",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "grey.50",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        onClick={() => setCommentsOpen(v => !v)}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCommentsOpen(v => !v);
          }
        }}
        role="button"
        tabIndex={0}
        aria-expanded={commentsOpen}
        sx={{
          mb: commentsOpen ? 2 : 0,
          py: 1,
          px: 0.5,
          borderRadius: 1,
          cursor: "pointer",
          userSelect: "none",
          "&:hover": { bgcolor: "action.hover" },
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <ChatBubbleOutlineRoundedIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            תגובות
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ({songComments.length})
          </Typography>
        </Stack>
        <ExpandMoreRoundedIcon
          sx={{
            color: "text.secondary",
            transform: commentsOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        />
      </Stack>

      <Collapse in={commentsOpen} timeout="auto" unmountOnExit={false}>
        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 2.5,
            borderRadius: 2,
            bgcolor: "background.paper",
            boxShadow: "0 2px 12px rgba(20, 28, 40, 0.06)",
          }}
        >
          <TextField
            placeholder="כתבי תגובה…"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={5}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
            }}
            onClick={e => e.stopPropagation()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "flex-end", mb: 0.5 }}>
                  <IconButton
                    color="primary"
                    onClick={e => {
                      e.stopPropagation();
                      handleAddComment();
                    }}
                    disabled={!newComment.trim() || submitting}
                    aria-label="שליחת תגובה"
                  >
                    <SendRoundedIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {songComments.length === 0 ? (
          <Box
            sx={{
              py: 4,
              textAlign: "center",
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.paper",
            }}
          >
            <Typography color="text.secondary">עדיין אין תגובות — תהיי הראשונה.</Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {songComments.map((c, idx) => {
              const when = c.date ? new Date(c.date) : new Date();
              const name = c.author || "אורח";
              return (
                <Paper
                  key={`${when.getTime()}-${idx}`}
                  elevation={0}
                  sx={{
                    p: 1.75,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "box-shadow 0.2s",
                    "&:hover": { boxShadow: "0 4px 20px rgba(20, 28, 40, 0.08)" },
                  }}
                >
                  <Stack direction="row" spacing={3} alignItems="flex-start">
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        fontWeight: 700,
                        bgcolor: "primary.main",
                        fontSize: "1rem",
                        flexShrink: 0,
                        mt: 0.25,
                      }}
                    >
                      {authorInitial(name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="baseline"
                        gap={1}
                        sx={{ mb: 1.5 }}
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {formatCommentTime(when)}
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 0.5,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.75,
                          color: "text.primary",
                        }}
                      >
                        {c.text}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Collapse>
    </Paper>
  );
}
