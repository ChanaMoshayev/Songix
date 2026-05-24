const mongoose = require("mongoose");

const contestRatingSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContestSubmission",
      required: true,
      index: true,
    },
    raterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },
    stars: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

contestRatingSchema.index({ submissionId: 1, raterUserId: 1 }, { unique: true });

module.exports = mongoose.model("ContestRating", contestRatingSchema);
