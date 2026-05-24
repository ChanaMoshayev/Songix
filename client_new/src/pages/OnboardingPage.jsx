import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPostLoginPath } from "../utils/postLoginPath.js";
import { fetchJson } from "../utils/apiBase.js";
import { getOrCreateDeviceId, saveAuthSession } from "../utils/authSession.js";
import {
  Alert,
  Box,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const emailValue = email.trim();
    const emailOk = emailValue.includes("@") && emailValue.includes(".");
    return username.trim().length >= 2 && emailOk && password.length >= 6;
  }, [username, email, password]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!canSubmit) {
      setError("מלאי שם משתמש, מייל וסיסמה (לפחות 6 תווים) כדי להמשיך.");
      return;
    }

    setSubmitting(true);
    try {
      const deviceId = getOrCreateDeviceId();
      let res;
      let data;
      try {
        const out = await fetchJson("/auth/register-request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password,
            deviceId,
          }),
        });
        res = out.res;
        data = out.data;
      } catch {
        setError("לא ניתן להתחבר לשרת. ודאי שהשרת רץ על פורט 5000.");
        return;
      }

      if (!res.ok) {
        setError(data?.message || "שגיאה בשליחת קוד למייל.");
        return;
      }

      setOtpId(String(data.otpId || ""));
      setStep("otp");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");

    if (!otpId || otp.trim().length !== 6) {
      setError("הכניסי קוד בן 6 ספרות.");
      return;
    }

    setSubmitting(true);
    try {
      const deviceId = getOrCreateDeviceId();
      let res;
      let data;
      try {
        const out = await fetchJson("/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otpId,
            otp: otp.trim(),
            deviceId,
          }),
        });
        res = out.res;
        data = out.data;
      } catch {
        setError("לא ניתן להתחבר לשרת. ודאי שהשרת רץ על פורט 5000.");
        return;
      }

      if (!res.ok) {
        setError(data?.message || "קוד לא תקין.");
        return;
      }

      saveAuthSession({ sessionToken: data?.sessionToken, user: data?.user });
      navigate(getPostLoginPath(data?.user), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ mt: { xs: 3, sm: 6 }, mb: { xs: 4, sm: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: 3,
          direction: "rtl",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "0 8px 40px rgba(20, 28, 40, 0.08)",
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          הרשמה לאתר
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {step === "form" ? "מלאי את הפרטים כדי ליצור חשבון." : "שלחנו קוד בן 6 ספרות למייל — הזיני אותו לאימות."}
        </Typography>

        <Box component="form" onSubmit={step === "form" ? handleSubmit : handleVerifyOtp} sx={{ mt: 3 }}>
          <Stack spacing={2}>
            {step === "form" ? (
              <>
                <TextField
                  label="שם משתמש"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  fullWidth
                  required
                  inputProps={{ minLength: 2 }}
                  disabled={submitting}
                />

                <TextField
                  label="מייל"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  fullWidth
                  required
                  disabled={submitting}
                />

                <TextField
                  label="סיסמה"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  fullWidth
                  required
                  inputProps={{ minLength: 6 }}
                  disabled={submitting}
                />
              </>
            ) : (
              <>
                <TextField
                  label="קוד אימות (6 ספרות)"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  fullWidth
                  required
                  disabled={submitting}
                />
                <Button
                  type="button"
                  variant="text"
                  disabled={submitting}
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setOtpId("");
                  }}
                >
                  חזרה לעריכת פרטים
                </Button>
              </>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={(step === "form" ? !canSubmit : otp.trim().length !== 6 || !otpId) || submitting}
            >
              {step === "form" ? "הרשמה" : "אימות והמשך"}
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              כבר יש לכם חשבון?{" "}
              <Link component="button" type="button" onClick={() => navigate("/login")} underline="hover">
                התחברו
              </Link>
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
}

