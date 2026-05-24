function createTransport() {
  const host = process.env.SMTP_HOST != null ? String(process.env.SMTP_HOST).trim() : "";
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER != null ? String(process.env.SMTP_USER).trim().replace(/^["']|["']$/g, "") : "";
  // סיסמת אפליקציה של Gmail מגיעה לעיתים עם רווחים — חייבים 16 תווים רצופים
  const passRaw = process.env.SMTP_PASS != null ? String(process.env.SMTP_PASS) : "";
  const pass = passRaw.replace(/\s+/g, "").replace(/^["']|["']$/g, "");

  // אם אין SMTP מוגדר — מדפיס לקונסול (כדי שתוכלו לבדוק מקומית)
  if (!host || !port || !user || !pass) {
    return null;
  }

  let nodemailer;
  try {
    // require דינמי כדי שהשרת לא יקרוס אם לא התקנתם עדיין את התלות
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
 * @returns {Promise<{ devConsoleOnly?: boolean }>}
 */
async function sendOtpEmail({ to, otp, kind = "login" }) {
  const from = process.env.MAIL_FROM || "no-reply@songix.local";
  const appName = process.env.APP_NAME || "Songix";

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

