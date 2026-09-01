import { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  Divider,
  Menu,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";

import SongSearchAutocomplete from "./SongSearchAutocomplete.jsx";
import { readPublisherObjectIdFromProfile } from "../utils/readPublisherIdFromProfile.js";
import { apiOrigin } from "../utils/apiBase.js";
import { isLoggedInLocally, logoutSession, readStoredProfile } from "../utils/authSession.js";
import { useAuth } from "./AuthGate.jsx";

function getInitials(text) {
  const t = String(text || "").trim();
  if (!t) return "?";
  const first = Array.from(t).find(ch => ch.trim() !== "") || "?";
  return first.toUpperCase();
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const { user: authUser } = useAuth();
  const profile = useMemo(() => readStoredProfile(), [location.pathname]);
  const profileLinkId = useMemo(() => {
    const fromProfile = readPublisherObjectIdFromProfile(profile);
    if (fromProfile) return fromProfile;
    if (authUser?._id) return String(authUser._id);
    return "";
  }, [profile, authUser]);
  const isLoggedIn = useMemo(
    () => isLoggedInLocally() || Boolean(authUser?._id),
    [location.pathname, profile, authUser]
  );

  const [anchorEl, setAnchorEl] = useState(null);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);

  const isSongs = location.pathname.startsWith("/songs");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiOrigin()}/categories`);
        const data = await res.json().catch(() => []);
        if (!cancelled && res.ok && Array.isArray(data)) setCategoryOptions(data);
        else if (!cancelled) setCategoryOptions([]);
      } catch {
        if (!cancelled) setCategoryOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchKey = searchParams.toString();

  useEffect(() => {
    if (!isSongs) return;
    const p = new URLSearchParams(searchKey);
    setQ(String(p.get("q") || ""));
    setCategory(String(p.get("category") || ""));
  }, [isSongs, searchKey]);

  const avatarSrc = profile?.profileImage ? String(profile.profileImage) : "";
  const avatarText = getInitials(profile?.username || profile?.email);

  const goSongs = useCallback(
    next => {
      const params = new URLSearchParams();
      const qVal = String(next?.q ?? "").trim();
      if (qVal) params.set("q", qVal);
      if (next?.category) params.set("category", next.category);
      const curArtist = searchParams.get("artist");
      if (curArtist && !next?.clearArtist) params.set("artist", curArtist);
      const qs = params.toString();
      navigate(qs ? `/songs?${qs}` : "/songs");
    },
    [navigate, searchParams]
  );

  const applySearchFromInput = useCallback(
    (qVal, cat) => {
      const currentQ = String(searchParams.get("q") || "").trim();
      const currentCat = String(searchParams.get("category") || "");
      if (qVal === currentQ && String(cat || "") === currentCat) return;
      goSongs({ q: qVal, category: cat });
    },
    [goSongs, searchParams]
  );

  const onSearchSubmit = e => {
    e.preventDefault();
    goSongs({ q: q.trim(), category });
  };

  const onCategoryChange = e => {
    const next = String(e.target.value);
    setCategory(next);
    goSongs({ q: q.trim(), category: next });
  };

  const onOpenMenu = e => setAnchorEl(e.currentTarget);
  const onCloseMenu = () => setAnchorEl(null);

  const onLogout = async () => {
    onCloseMenu();
    await logoutSession();
    navigate("/login", { replace: true });
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 0 rgba(20, 28, 40, 0.04)",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar
          disableGutters
          sx={{
            minHeight: { xs: "auto", md: 64 },
            direction: "rtl",
            flexWrap: "wrap",
            gap: 1,
            py: { xs: 1, md: 0.5 },
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* ימין: פרופיל, לוגו, כפתורי עמודים */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Tooltip title="פרופיל">
              <IconButton onClick={onOpenMenu} sx={{ mr: 0.5 }}>
                <Avatar
                  src={avatarSrc}
                  alt="profile"
                  sx={{
                    width: 38,
                    height: 38,
                    border: "2px solid",
                    borderColor: "divider",
                    bgcolor: "primary.main",
                  }}
                >
                  {avatarText}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onCloseMenu}>
              <MenuItem disabled>
                {profile?.username || authUser?.username
                  ? `מחובר/ת: ${profile?.username || authUser?.username}`
                  : "אורח/ת"}
              </MenuItem>
              {isLoggedIn
                ? [
                    profileLinkId ? (
                      <MenuItem
                        key="profile"
                        onClick={() => {
                          onCloseMenu();
                          navigate(`/profile/${profileLinkId}`);
                        }}
                      >
                        פרופיל ושירים מועדפים
                      </MenuItem>
                    ) : null,
                    <Divider key="divider" />,
                    <MenuItem key="logout" onClick={onLogout}>
                      התנתקות
                    </MenuItem>,
                  ]
                : (
                    <MenuItem
                      key="login"
                      onClick={() => {
                        onCloseMenu();
                        navigate("/login");
                      }}
                    >
                      התחברות
                    </MenuItem>
                  )}
            </Menu>

            <Stack
              direction="row"
              alignItems="center"
              spacing={0.75}
              onClick={() => navigate("/songs")}
              sx={{
                cursor: "pointer",
                userSelect: "none",
                py: 0.25,
                pr: 0.5,
                borderRadius: 2,
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <LibraryMusicRoundedIcon sx={{ color: "primary.main", fontSize: { xs: 26, sm: 30 } }} aria-hidden />
              <Typography
                variant="h6"
                sx={{ fontWeight: 900, letterSpacing: 0.02, fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Songix
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              <Button
                component={RouterLink}
                to="/songs"
                color={isSongs ? "primary" : "inherit"}
                variant={isSongs ? "contained" : "text"}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                שירים
              </Button>
              <Button
                component={RouterLink}
                to="/contest"
                color={location.pathname === "/contest" ? "primary" : "inherit"}
                variant={location.pathname === "/contest" ? "contained" : "text"}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                תחרות
              </Button>
              {profile?.status === "admin" ? (
                <Button
                  component={RouterLink}
                  to="/admin/songs"
                  color={location.pathname.startsWith("/admin") ? "primary" : "inherit"}
                  variant={location.pathname.startsWith("/admin") ? "contained" : "text"}
                  size="small"
                  sx={{ borderRadius: 2 }}
                >
                  ניהול
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {/* שמאל: חיפוש וקטגוריה (רק בעמוד שירים) */}
          {isSongs ? (
            <Box
              component="form"
              onSubmit={onSearchSubmit}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                alignItems: { xs: "stretch", sm: "center" },
                width: { xs: "100%", sm: "auto" },
                minWidth: 0,
              }}
            >
              <SongSearchAutocomplete
                value={q}
                onChange={setQ}
                category={category}
                onApplySearch={applySearchFromInput}
              />
              <FormControl size="small" sx={{ width: { xs: "100%", sm: 160, md: 170 }, minWidth: 0 }}>
                <InputLabel>קטגוריה</InputLabel>
                <Select value={category} label="קטגוריה" onChange={onCategoryChange}>
                  <MenuItem value="">כל הקטגוריות</MenuItem>
                  {categoryOptions.map(c => (
                    <MenuItem key={String(c._id)} value={String(c._id)}>
                      {c.categoryName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          ) : null}
        </Toolbar>
      </Container>
    </AppBar>
  );
}
