const mongoose = require("mongoose");

const loginOtpSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    deviceId: { type: String, required: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    usedAt: { type: Date, default: null },
    /** login — קוד להתחברות/הרשמה; password_reset — קוד לאיפוס סיסמה */
    purpose: {
      type: String,
      enum: ["login", "password_reset"],
      default: "login",
    },
  },
  { timestamps: true }
);

// מחיקה אוטומטית של OTP שפג תוקף (Mongo TTL)
loginOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("LoginOtp", loginOtpSchema);

