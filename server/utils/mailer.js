function cleanEnv(value) {
  return value != null ? String(value).trim().replace(/^["']|["']$/g, "") : "";
}

function createTransport() {
  const host = cleanEnv(process.env.SMTP_HOST);
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = cleanEnv(process.env.SMTP_USER);
  const passRaw = process.env.SMTP_PASS != null ? String(process.env.SMTP_PASS) : "";
  const pass = passRaw.replace(/\s+/g, "").replace(/^["']|["']$/g, "");

  if (!host || !port || !user || !pass) {
    return null;
  }

  let nodemailer;
  try {
    nodemailer = require("nodemailer");
  } catch (e) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * @param {{ to: string, otp: string, kind?: "login" | "password_reset" }} opts
 * @returns {Promise<{ devConsoleOnly?: boolean, mailError?: string }>}
 */
async function sendOtpEmail({ to, otp, kind = "login" }) {
  const from = cleanEnv(process.env.MAIL_FROM) || cleanEnv(process.env.SMTP_USER) || "no-reply@songix.local";
  const appName = cleanEnv(process.env.APP_NAME) || "Songix";

  const isReset = kind === "password_reset";
  const subject = isReset ? `${appName} - קוד לאיפוס סיסמה` : `${appName} - קוד התחברות`;
  const body = isReset
    ? `קוד לאיפוס הסיסמה שלך הוא: ${otp}\nהקוד תקף למספר דקות.\nאם לא ביקשת איפוס — התעלמי מהודעה זו.`
    : `קוד ההתחברות שלך הוא: ${otp}\nהקוד תקף למספר דקות.`;

  const transport = createTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.log(`[DEV-OTP] kind=${kind} to=${to} otp=${otp}`);
    return { devConsoleOnly: true };
  }

  try {
    await transport.sendMail({
      from,
      to,
      subject,
      text: body,
    });
    return { devConsoleOnly: false };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[mailer] sendMail failed:", err && err.message ? err.message : err);
    // eslint-disable-next-line no-console
    console.log(`[DEV-OTP fallback] kind=${kind} to=${to} otp=${otp}`);
    return { devConsoleOnly: true, mailError: String(err && err.message ? err.message : err) };
  }
}

module.exports = { sendOtpEmail };
