const mongoose = require("mongoose");

const contestSubmissionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lyrics", "melody"],
      required: true,
    },
    title: { type: String, trim: true },
    lyrics: { type: String },
    baseSongId: { type: mongoose.Schema.Types.ObjectId, ref: "Song" },
    baseSongTitle: { type: String, trim: true },
    melodyAudioDataUrl: { type: String },
    notes: { type: String, trim: true },
    author: { type: String, trim: true, required: true },
    authorUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    authorEmail: { type: String, trim: true, lowercase: true },
    /** לאחר הוספה למערכת — לא מוצג עוד ברשימת התחרות */
    promotedSongId: { type: mongoose.Schema.Types.ObjectId, ref: "Song", default: null },
    promotedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContestSubmission", contestSubmissionSchema);
