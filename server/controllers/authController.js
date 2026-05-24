const User = require("../models/usersModel");
const LoginOtp = require("../models/loginOtpModel");
const Session = require("../models/sessionModel");
const { makeOtp6, otpHash, makeRandomToken, sessionTokenHash } = require("../utils/authTokens");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_TTL_MINUTES = process.env.OTP_TTL_MINUTES ? Number(process.env.OTP_TTL_MINUTES) : 10;
const SESSION_TTL_DAYS = process.env.SESSION_TTL_DAYS ? Number(process.env.SESSION_TTL_DAYS) : 30;

function isProbablyEmail(value) {
  return typeof value === "string" && value.includes("@") && value.includes(".");
}

function toHebrewErrorMessage(err) {
  // Mongo duplicate key
  if (err && err.code === 11000) {
    const keys = Object.keys(err.keyPattern || err.keyValue || {});
    if (keys.includes("email")) return "המייל כבר רשום במערכת.";
    if (keys.includes("username")) return "שם המשתמש כבר תפוס.";
    return "קיים כבר משתמש עם אותם פרטים.";
  }

  // Mongoose validation
  if (err && err.name === "ValidationError") {
    const msg = String(err.message || "");
    if (msg.toLowerCase().includes("password")) return "הסיסמה חייבת להכיל לפחות 6 תווים.";
    if (msg.toLowerCase().includes("email")) return "מייל לא תקין.";
    if (msg.toLowerCase().includes("username")) return "שם משתמש לא תקין.";
    return "אחד השדות לא תקין. בדקי את הפרטים ונסי שוב.";
  }

  return "אירעה שגיאה. נסי שוב.";
}

const requestOtp = async (req, res) => {
  try {
    const { email, username, password, deviceId } = req.body || {};
    const emailValue = String(email || username || "").trim().toLowerCase();
    if (!emailValue || !password || !deviceId) {
      return res.status(400).send({ message: "חסרים פרטים: מייל/סיסמה/מזהה מכשיר." });
    }

    const user = await User.findOne({ email: emailValue });
    if (!user) return res.status(401).send({ message: "מייל או סיסמה לא נכונים." });

    const ok = await user.verifyPassword(String(password));
    if (!ok) return res.status(401).send({ message: "מייל או סיסמה לא נכונים." });

    // אם הסיסמה הייתה לא מוצפנת (legacy) ועדיין התאימה — נשדרג אותה ל-bcrypt
    if (typeof user.password === "string" && !user.password.startsWith("$2")) {
      user.password = String(password);
      await user.save();
    }

    if (!isProbablyEmail(user.email)) {
      return res.status(400).send({ message: "מייל לא תקין לשליחת קוד." });
    }

    const otp = makeOtp6();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const otpDoc = await LoginOtp.create({
      userId: user._id,
      deviceId: String(deviceId),
      otpHash: otpHash(otp),
      expiresAt,
      attempts: 0,
      purpose: "login",
    });

    await sendOtpEmail({ to: user.email, otp });

    return res.status(200).send({
      message: "נשלח קוד אימות למייל.",
      otpId: otpDoc._id,
      expiresAt: otpDoc.expiresAt,
    });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

/** בקשת איפוס סיסמה — שולח OTP למייל בלי לדרוש סיסמה קיימת */
const forgotPasswordRequest = async (req, res) => {
  try {
    const { email, deviceId } = req.body || {};
    const emailValue = String(email || "").trim().toLowerCase();
    if (!emailValue || !deviceId) {
      return res.status(400).send({ message: "חסרים פרטים: מייל/מזהה מכשיר." });
    }
    if (!isProbablyEmail(emailValue)) {
      return res.status(400).send({ message: "מייל לא תקין." });
    }

    const user = await User.findOne({ email: emailValue });
    if (!user) {
      return res.status(200).send({
        message: "אם המייל רשום במערכת, יישלח אליו קוד לאיפוס הסיסמה.",
        otpId: null,
      });
    }
    // רק משתמש שמפורש שלא אימת מייל — לא חוסמים legacy שבו השדה undefined
    if (user.isEmailVerified === false) {
      return res.status(400).send({
        message: "יש להשלים הרשמה ואימות מייל לפני איפוס סיסמה.",
      });
    }

    const otp = makeOtp6();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const otpDoc = await LoginOtp.create({
      userId: user._id,
      deviceId: String(deviceId),
      otpHash: otpHash(otp),
      expiresAt,
      attempts: 0,
      purpose: "password_reset",
    });

    const mailMeta = await sendOtpEmail({ to: user.email, otp, kind: "password_reset" });

    const mailFailed = Boolean(mailMeta && mailMeta.mailError);
    return res.status(200).send({
      message: mailFailed
        ? "הקוד מוכן — שליחת המייל נכשלה; ראי את הקוד בקונסול השרת או בדקי הגדרות SMTP."
        : "נשלח קוד אימות למייל לאיפוס הסיסמה.",
      otpId: otpDoc._id,
      expiresAt: otpDoc.expiresAt,
      devOtpHint: Boolean(mailMeta && mailMeta.devConsoleOnly),
      mailSendFailed: mailFailed,
    });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

/** אימות OTP לאיפוס + עדכון סיסמה והתחברות */
const forgotPasswordVerify = async (req, res) => {
  try {
    const { otpId, otp, deviceId, newPassword } = req.body || {};
    if (!otpId || !otp || !deviceId || newPassword == null) {
      return res.status(400).send({ message: "חסרים פרטים: מזהה קוד/קוד/מכשיר/סיסמה חדשה." });
    }
    const pwd = String(newPassword);
    if (pwd.length < 6) {
      return res.status(400).send({ message: "הסיסמה החדשה חייבת להכיל לפחות 6 תווים." });
    }

    const otpDoc = await LoginOtp.findById(otpId);
    if (!otpDoc) return res.status(400).send({ message: "קוד האימות לא נמצא. בקשי קוד חדש." });
    if (otpDoc.purpose !== "password_reset") {
      return res.status(400).send({ message: "קוד זה לא מיועד לאיפוס סיסמה." });
    }
    if (otpDoc.usedAt) return res.status(400).send({ message: "הקוד כבר נוצל. בקשי קוד חדש." });
    if (String(otpDoc.deviceId) !== String(deviceId)) {
      return res.status(400).send({ message: "הקוד שויך למכשיר אחר. בקשי קוד חדש." });
    }
    if (otpDoc.expiresAt.getTime() < Date.now()) return res.status(400).send({ message: "תוקף הקוד פג. בקשי קוד חדש." });
    if ((otpDoc.attempts || 0) >= 5) return res.status(429).send({ message: "בוצעו יותר מדי ניסיונות. בקשי קוד חדש." });

    const gotHash = otpHash(String(otp));
    if (gotHash !== otpDoc.otpHash) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(401).send({ message: "קוד אימות שגוי." });
    }

    otpDoc.usedAt = new Date();
    await otpDoc.save();

    const userForPwd = await User.findById(otpDoc.userId);
    if (!userForPwd) return res.status(400).send({ message: "משתמש לא נמצא." });
    userForPwd.password = pwd;
    await userForPwd.save();

    const sessionToken = makeRandomToken(32);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: otpDoc.userId,
      deviceId: String(deviceId),
      sessionTokenHash: sessionTokenHash(sessionToken),
      expiresAt: sessionExpiresAt,
      lastUsedAt: new Date(),
    });

    const user = await User.findById(otpDoc.userId).select("_id username email status profileImage");
    return res.status(200).send({
      message: "הסיסמה עודכנה והתחברת בהצלחה.",
      sessionToken,
      sessionExpiresAt,
      user,
    });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

const registerRequestOtp = async (req, res) => {
  try {
    const { username, email, password, deviceId } = req.body || {};
    const usernameValue = String(username || "").trim();
    const emailValue = String(email || "").trim().toLowerCase();

    if (!usernameValue || !emailValue || !password || !deviceId) {
      return res.status(400).send({ message: "חסרים פרטים: שם משתמש/מייל/סיסמה/מזהה מכשיר." });
    }
    if (!isProbablyEmail(emailValue)) return res.status(400).send({ message: "מייל לא תקין." });

    let user = await User.findOne({ email: emailValue });

    // אם כבר נרשמה בעבר אבל לא אימתה מייל — נשלח OTP מחדש במקום 409
    if (user && user.isEmailVerified === false) {
      user.username = usernameValue; // מאפשר לתקן שם משתמש לפני אימות
      user.password = String(password); // מאפשר לעדכן סיסמה לפני אימות
      await user.save();
    } else if (user) {
      return res.status(409).send({ message: "המייל כבר רשום במערכת." });
    } else {
      user = await User.create({
        username: usernameValue,
        email: emailValue,
        password: String(password),
        status: "user",
        isEmailVerified: false,
      });
    }

    const otp = makeOtp6();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    const otpDoc = await LoginOtp.create({
      userId: user._id,
      deviceId: String(deviceId),
      otpHash: otpHash(otp),
      expiresAt,
      attempts: 0,
      purpose: "login",
    });

    await sendOtpEmail({ to: user.email, otp });

    return res.status(200).send({
      message: "נשלח קוד אימות למייל.",
      otpId: otpDoc._id,
      expiresAt: otpDoc.expiresAt,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("registerRequestOtp error:", err);
    if (err && err.code === 11000) {
      return res.status(409).send({ message: toHebrewErrorMessage(err) });
    }
    if (err && err.name === "ValidationError") {
      return res.status(400).send({ message: toHebrewErrorMessage(err) });
    }
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otpId, otp, deviceId } = req.body || {};
    if (!otpId || !otp || !deviceId) {
      return res.status(400).send({ message: "חסרים פרטים: מזהה קוד/קוד אימות/מזהה מכשיר." });
    }

    const otpDoc = await LoginOtp.findById(otpId);
    if (!otpDoc) return res.status(400).send({ message: "קוד האימות לא נמצא. בקשי קוד חדש." });
    if (otpDoc.purpose === "password_reset") {
      return res.status(400).send({ message: "קוד זה מיועד לאיפוס סיסמה. השתמשי בזרימת 'שכחתי סיסמה'." });
    }
    if (otpDoc.usedAt) return res.status(400).send({ message: "הקוד כבר נוצל. בקשי קוד חדש." });
    if (String(otpDoc.deviceId) !== String(deviceId)) {
      return res.status(400).send({ message: "הקוד שויך למכשיר אחר. בקשי קוד חדש." });
    }
    if (otpDoc.expiresAt.getTime() < Date.now()) return res.status(400).send({ message: "תוקף הקוד פג. בקשי קוד חדש." });
    if ((otpDoc.attempts || 0) >= 5) return res.status(429).send({ message: "בוצעו יותר מדי ניסיונות. בקשי קוד חדש." });

    const expectedHash = otpDoc.otpHash;
    const gotHash = otpHash(String(otp));
    if (gotHash !== expectedHash) {
      otpDoc.attempts = (otpDoc.attempts || 0) + 1;
      await otpDoc.save();
      return res.status(401).send({ message: "קוד אימות שגוי." });
    }

    otpDoc.usedAt = new Date();
    await otpDoc.save();

    await User.findByIdAndUpdate(otpDoc.userId, { $set: { isEmailVerified: true } });

    const sessionToken = makeRandomToken(32);
    const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

    await Session.create({
      userId: otpDoc.userId,
      deviceId: String(deviceId),
      sessionTokenHash: sessionTokenHash(sessionToken),
      expiresAt: sessionExpiresAt,
      lastUsedAt: new Date(),
    });

    const user = await User.findById(otpDoc.userId).select("_id username email status profileImage");
    return res.status(200).send({
      message: "התחברות הצליחה.",
      sessionToken,
      sessionExpiresAt,
      user,
    });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

const sessionLogin = async (req, res) => {
  try {
    const { deviceId, sessionToken } = req.body || {};
    if (!deviceId || !sessionToken) return res.status(400).send({ message: "חסרים פרטים: מזהה מכשיר/טוקן התחברות." });

    const tokenHash = sessionTokenHash(String(sessionToken));
    const session = await Session.findOne({ sessionTokenHash: tokenHash, deviceId: String(deviceId) });
    if (!session) return res.status(401).send({ message: "הסשן לא תקין. התחברי מחדש." });
    if (session.expiresAt.getTime() < Date.now()) return res.status(401).send({ message: "הסשן פג תוקף. התחברי מחדש." });

    session.lastUsedAt = new Date();
    await session.save();

    const user = await User.findById(session.userId).select("_id username email status profileImage");
    return res.status(200).send({ message: "התחברות אוטומטית הצליחה.", user });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

const logout = async (req, res) => {
  try {
    const { deviceId, sessionToken } = req.body || {};
    if (!deviceId || !sessionToken) return res.status(400).send({ message: "חסרים פרטים: מזהה מכשיר/טוקן התחברות." });

    const tokenHash = sessionTokenHash(String(sessionToken));
    await Session.deleteOne({ sessionTokenHash: tokenHash, deviceId: String(deviceId) });
    return res.status(200).send({ message: "התנתקת בהצלחה." });
  } catch (err) {
    return res.status(500).send({ message: toHebrewErrorMessage(err) });
  }
};

module.exports = {
  requestOtp,
  registerRequestOtp,
  verifyOtp,
  forgotPasswordRequest,
  forgotPasswordVerify,
  sessionLogin,
  logout,
};

