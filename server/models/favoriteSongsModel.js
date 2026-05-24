const mongoose = require("mongoose");

const favoriteSongSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true
  },
  song: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Song",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// למנוע כפילויות (אותו משתמש ואותו שיר פעמיים)
favoriteSongSchema.index({ user: 1, song: 1 }, { unique: true });

module.exports = mongoose.model("FavoriteSong", favoriteSongSchema);
