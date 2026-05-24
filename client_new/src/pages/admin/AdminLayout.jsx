import { Outlet, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { logoutSession } from "../../utils/authSession.js";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const onLogout = async () => {
    await logoutSession();
    navigate("/login", { replace: true });
  };

  const pathSongs = location.pathname.startsWith("/admin/songs") || location.pathname === "/admin";
  const pathArtists = location.pathname.startsWith("/admin/artists");
  const pathContests = location.pathname.startsWith("/admin/contests");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", boxShadow: "0 1px 0 rgba(20, 28, 40, 0.04)" }}
      >
        <Container maxWidth="lg">
          <Toolbar
            disableGutters
            sx={{
              minHeight: { xs: "auto", sm: 64 },
              direction: "rtl",
              gap: 1,
              flexWrap: "wrap",
              py: { xs: 1.25, sm: 1 },
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 900, mr: 1 }}>
              ניהול
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
              <Button
                component={RouterLink}
                to="/admin/songs"
                variant={pathSongs ? "contained" : "text"}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                ניהול שירים
              </Button>
              <Button
                component={RouterLink}
                to="/admin/artists"
                variant={pathArtists ? "contained" : "text"}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                זמרים
              </Button>
              <Button
                component={RouterLink}
                to="/admin/contests"
                variant={pathContests ? "contained" : "text"}
                size="small"
                sx={{ borderRadius: 2 }}
              >
                תחרויות
              </Button>
            </Stack>
            <Button component={RouterLink} to="/songs" size="small" variant="outlined" sx={{ borderRadius: 2 }}>
              לאתר
            </Button>
            <Button onClick={onLogout} size="small" color="inherit" sx={{ borderRadius: 2 }}>
              התנתקות
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Outlet />
      </Container>
    </Box>
  );
}
