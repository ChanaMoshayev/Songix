import { createTheme } from "@mui/material/styles";

/**
 * ערכת צבעים וטיפוגרפיה אחידה לאפליקציה (מצב בהיר, מותאם לעברית).
 */
const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2c3e5c",
      light: "#4a6282",
      dark: "#1a2838",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#b08d28",
      light: "#c9a73d",
      dark: "#8a6e1c",
      contrastText: "#ffffff",
    },
    background: {
      default: "#e8ecf3",
      paper: "#ffffff",
    },
    text: {
      primary: "#141c28",
      secondary: "#5a6474",
    },
    divider: "rgba(20, 28, 40, 0.09)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Heebo", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
      fontSize: "1.5rem",
      lineHeight: 1.25,
      "@media (min-width:600px)": { fontSize: "2.125rem" },
    },
    h5: {
      fontWeight: 800,
      fontSize: "1.2rem",
      "@media (min-width:600px)": { fontSize: "1.5rem" },
    },
    h6: { fontWeight: 700 },
    subtitle1: { fontWeight: 600 },
    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          overflowX: "hidden",
        },
        body: {
          backgroundColor: "#e8ecf3",
          backgroundImage:
            "radial-gradient(ellipse 100% 70% at 50% -25%, rgba(44, 62, 92, 0.11), transparent 52%)",
          overflowX: "hidden",
        },
        "#root": {
          maxWidth: "100%",
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          "@media (min-width:600px)": {
            paddingLeft: 24,
            paddingRight: 24,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          "@media (max-width:599.95px)": {
            margin: 12,
            width: "calc(100% - 24px)",
            maxWidth: "calc(100% - 24px) !important",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          wordBreak: "break-word",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        containedPrimary: {
          boxShadow: "0 2px 8px rgba(44, 62, 92, 0.2)",
          "&:hover": {
            boxShadow: "0 4px 14px rgba(44, 62, 92, 0.26)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid",
          borderColor: "rgba(20, 28, 40, 0.07)",
          boxShadow: "0 2px 14px rgba(20, 28, 40, 0.06)",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: "0 10px 32px rgba(20, 28, 40, 0.11)",
            borderColor: "rgba(44, 62, 92, 0.14)",
          },
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        colorDefault: {
          backgroundColor: "rgba(255, 255, 255, 0.88)",
          backdropFilter: "saturate(160%) blur(14px)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default appTheme;
