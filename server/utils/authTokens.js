const crypto = require("crypto");

function sha256(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex");
}

function makeRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function makeOtp6() {
  // 000000-999999, תמיד 6 ספרות
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

function otpHash(otp) {
  const secret = process.env.OTP_SECRET || "dev-otp-secret";
  return sha256(`${secret}:${otp}`);
}

function sessionTokenHash(token) {
  const secret = process.env.SESSION_SECRET || "dev-session-secret";
  return sha256(`${secret}:${token}`);
}

module.exports = {
  makeRandomToken,
  makeOtp6,
  otpHash,
  sessionTokenHash,
};

