import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPostLoginPath } from "../utils/postLoginPath.js";
import { fetchJson, formatFetchError } from "../utils/apiBase.js";
import { getOrCreateDeviceId, saveAuthSession } from "../utils/authSession.js";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import { Alert, Paper, Stack } from "@mui/material";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpId, setOtpId] = useState("");
  const [step, setStep] = useState("login_credentials");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canRequestOtp = useMemo(() => {
    const e = email.trim();
    return e.includes("@") && e.includes(".") && password.length >= 1;
  }, [email, password]);

  const canForgotRequest = useMemo(() => {
    const e = email.trim();
    return e.includes("@") && e.includes(".");
  }, [email]);

  const canForgotVerify = useMemo(() => {
    return (
      Boolean(otpId) &&
      otp.trim().length === 6 &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword
    );
  }, [otpId, otp, newPassword, confirmPassword]);

  function goToLoginCredentials() {
    setStep("login_credentials");
    setOtp("");
    setOtpId("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setInfo("");
  }

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!canRequestOtp) {
      setError("הזיני מייל וסיסמה.");
      return;
    }
    setSubmitting(true);
    try {
      const deviceId = getOrCreateDeviceId();
      let res;
      let data;
      try {
        const out = await fetchJson("/auth/request-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
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
        setError(formatFetchError(res, data));
        return;
      }
      setOtpId(String(data.otpId || ""));
      setStep("login_otp");
      if (data?.message) setInfo(String(data.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setInfo("");
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
        setError(formatFetchError(res, data));
        return;
      }

      saveAuthSession({ sessionToken: data?.sessionToken, user: data?.user });
      navigate(getPostLoginPath(data?.user), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  /** שליחת בקשת OTP לאיפוס — משותף ללחיצה על "שכחתי סיסמה" ולכפתור בשלב forgot_email */
  async function requestForgotCode() {
    setError("");
    setInfo("");
    if (!canForgotRequest) {
      setError("הזיני כתובת מייל תקינה.");
      return;
    }
    setSubmitting(true);
    try {
      const deviceId = getOrCreateDeviceId();
      let res;
      let data;
      try {
        const out = await fetchJson("/auth/forgot-password-request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
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
        setError(formatFetchError(res, data));
        return;
      }
      if (data?.otpId) {
        setOtpId(String(data.otpId));
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        setStep("forgot_reset");
        let msg = data?.message || "הזיני את הקוד מהמייל ובחרי סיסמה חדשה.";
        if (data?.devOtpHint && !data?.mailSendFailed) {
          msg += " במצב פיתוח הקוד מודפס גם בטרמינל שבו רץ השרת.";
        }
        setInfo(msg);
      } else {
        setInfo(data?.message || "אם המייל רשום במערכת, יישלח אליו קוד.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotRequest(e) {
    e.preventDefault();
    await requestForgotCode();
  }

  async function handleForgotVerify(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!canForgotVerify) {
      if (newPassword.length < 6) setError("הסיסמה החדשה חייבת להכיל לפחות 6 תווים.");
      else if (newPassword !== confirmPassword) setError("הסיסמאות החדשות אינן תואמות.");
      else setError("הכניסי קוד בן 6 ספרות.");
      return;
    }
    setSubmitting(true);
    try {
      const deviceId = getOrCreateDeviceId();
      let res;
      let data;
      try {
        const out = await fetchJson("/auth/forgot-password-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            otpId,
            otp: otp.trim(),
            deviceId,
            newPassword,
          }),
        });
        res = out.res;
        data = out.data;
      } catch {
        setError("לא ניתן להתחבר לשרת. ודאי שהשרת רץ על פורט 5000.");
        return;
      }
      if (!res.ok) {
        setError(formatFetchError(res, data));
        return;
      }

      saveAuthSession({ sessionToken: data?.sessionToken, user: data?.user });
      navigate(getPostLoginPath(data?.user), { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormSubmit(e) {
    if (step === "login_credentials") return handleRequestOtp(e);
    if (step === "login_otp") return handleVerifyOtp(e);
    if (step === "forgot_email") return handleForgotRequest(e);
    if (step === "forgot_reset") return handleForgotVerify(e);
    e.preventDefault();
  }

  const submitLabel =
    step === "login_credentials"
      ? "שליחת קוד למייל"
      : step === "login_otp"
        ? "התחברות"
        : step === "forgot_email"
          ? "שליחת קוד לאיפוס"
          : "איפוס סיסמה והתחברות";

  return (
    <Container component="main" maxWidth="xs" sx={{ mt: { xs: 3, sm: 6 }, mb: 4 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
        <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          {step === "forgot_email" || step === "forgot_reset" ? "איפוס סיסמה" : "התחברות"}
        </Typography>
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2.5,
            width: "100%",
            borderRadius: 2,
            direction: "rtl",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "0 8px 40px rgba(20, 28, 40, 0.08)",
          }}
        >
          <Box component="form" noValidate onSubmit={handleFormSubmit} sx={{ mt: 0 }}>
            <Stack spacing={2}>
              {step === "login_credentials" ? (
                <>
                  <TextField
                    required
                    fullWidth
                    label="מייל"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                  <TextField
                    required
                    fullWidth
                    label="סיסמה"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Box sx={{ textAlign: "start" }}>
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      disabled={submitting}
                      onClick={async e => {
                        e.preventDefault();
                        setPassword("");
                        setOtp("");
                        setOtpId("");
                        setNewPassword("");
                        setConfirmPassword("");
                        const em = email.trim();
                        if (em.includes("@") && em.includes(".")) {
                          await requestForgotCode();
                        } else {
                          setError("");
                          setInfo("הזיני מייל בשדה למעלה, ואז לחצי שוב על «שכחתי סיסמה» או על «שליחת קוד לאיפוס».");
                          setStep("forgot_email");
                        }
                      }}
                    >
                      שכחתי סיסמה
                    </Link>
                  </Box>
                </>
              ) : null}

              {step === "login_otp" ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    נשלח קוד בן 6 ספרות ל-{email.trim()}
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    label="קוד אימות"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <Button type="button" variant="text" disabled={submitting} onClick={goToLoginCredentials}>
                    חזרה
                  </Button>
                </>
              ) : null}

              {step === "forgot_email" ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    הזיני מייל ולחצי «שליחת קוד לאיפוס». אם כבר הזנת מייל במסך ההתחברות, חזרי לשם ולחצי «שכחתי סיסמה» — הקוד יישלח מיד.
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    label="מייל"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="text"
                    disabled={submitting}
                    onClick={() => {
                      goToLoginCredentials();
                    }}
                  >
                    חזרה להתחברות
                  </Button>
                </>
              ) : null}

              {step === "forgot_reset" ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    מייל: {email.trim()}
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    label="קוד מהמייל (6 ספרות)"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                  <TextField
                    required
                    fullWidth
                    label="סיסמה חדשה"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    inputProps={{ minLength: 6 }}
                  />
                  <TextField
                    required
                    fullWidth
                    label="אימות סיסמה חדשה"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="text"
                    disabled={submitting}
                    onClick={() => {
                      setError("");
                      setInfo("");
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setStep("forgot_email");
                    }}
                  >
                    חזרה לשליחת קוד
                  </Button>
                </>
              ) : null}

              {error ? <Alert severity="error">{error}</Alert> : null}
              {info ? <Alert severity="info">{info}</Alert> : null}

              {(step === "login_credentials" ||
                step === "login_otp" ||
                step === "forgot_email" ||
                step === "forgot_reset") && (
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={
                    submitting ||
                    (step === "login_credentials" && !canRequestOtp) ||
                    (step === "login_otp" && (otp.trim().length !== 6 || !otpId)) ||
                    (step === "forgot_email" && !canForgotRequest) ||
                    (step === "forgot_reset" && !canForgotVerify)
                  }
                >
                  {submitting ? "ממתין…" : submitLabel}
                </Button>
              )}
            </Stack>
          </Box>
        </Paper>

        {step === "login_credentials" ? (
          <Grid container sx={{ mt: 2 }}>
            <Grid item>
              <Link component="button" type="button" onClick={() => navigate("/register")} variant="body2">
                אין חשבון? הרשמה
              </Link>
            </Grid>
          </Grid>
        ) : null}
      </Box>
    </Container>
  );
}
