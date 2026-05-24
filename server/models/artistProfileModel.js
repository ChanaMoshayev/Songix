const mongoose = require("mongoose");

const artistProfileSchema = new mongoose.Schema(
  {
    /** מפתח ייחודי — אמן אחד בלבד */
    nameKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    profileImageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    /** true רק אחרי «שמירת זמר» בניהול (לא מהעלאת תמונה בלבד) */
    featuredInStrip: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArtistProfile", artistProfileSchema);
