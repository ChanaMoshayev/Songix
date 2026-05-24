//לייבא את המודל לעמוד שלי
const mongoose = require("mongoose");
const Song = require("../models/songsModel");
const User = require("../models/usersModel");
const Category = require("../models/categoriesModel");
const FavoriteSong = require("../models/favoriteSongsModel");
const ContestSubmission = require("../models/contestSubmissionModel");
const ContestRating = require("../models/contestRatingModel");
const { normalizeCategoryIds } = require("../utils/songCategoryIds");
const { resolveErrorMessage } = require("../utils/mongoErrors");
const { normalizeUploadPath } = require("../utils/normalizeMediaUrl");

function stripSongPayload(body) {
  if (!body || typeof body !== "object") return {};
  const { categoryId, categoryIds, ...rest } = body;
  return rest;
}

function sendErr(res, status, err) {
  const msg = resolveErrorMessage(err, "שגיאת שרת");
  if (status >= 500) console.error("[songs]", err?.message || err);
  return res.status(status).json({ message: msg });
}

async function attachSongStats(songs) {
  const rows = await FavoriteSong.aggregate([
    { $group: { _id: "$song", favoriteCount: { $sum: 1 } } },
  ]);
  const favMap = new Map(rows.map(r => [String(r._id), r.favoriteCount]));
  return songs.map(s => {
    const o = typeof s.toObject === "function" ? s.toObject() : { ...s };
    return {
      ...o,
      playCount: Number(o.playCount) || 0,
      favoriteCount: favMap.get(String(o._id)) || 0,
      isLeading: Boolean(o.isLeading),
    };
  });
}

const ACTIVE_CONTEST_FILTER = {
  $or: [{ promotedSongId: null }, { promotedSongId: { $exists: false } }],
};

async function pickTopContestEntry() {
  const list = await ContestSubmission.find(ACTIVE_CONTEST_FILTER).lean();
  if (!list.length) return null;

  const ids = list.map(s => s._id);
  const agg = await ContestRating.aggregate([
    { $match: { submissionId: { $in: ids } } },
    {
      $group: {
        _id: "$submissionId",
        totalPoints: { $sum: "$stars" },
        ratingsCount: { $sum: 1 },
      },
    },
  ]);
  const scoreById = new Map(agg.map(r => [String(r._id), r]));

  let best = null;
  let bestPoints = -1;
  for (const s of list) {
    const row = scoreById.get(String(s._id));
    const points = row?.totalPoints ?? 0;
    if (points > bestPoints) {
      bestPoints = points;
      best = { ...s, totalPoints: points };
    }
  }

  if (best && bestPoints > 0) return best;

  const melodyWithAudio = list.find(s => s.type === "melody" && String(s.melodyAudioDataUrl || "").trim());
  if (melodyWithAudio) return { ...melodyWithAudio, totalPoints: 0 };

  const lyricsEntry = list.find(s => s.type === "lyrics" && String(s.title || "").trim());
  return lyricsEntry ? { ...lyricsEntry, totalPoints: 0 } : null;
}

/** מוביל בעמוד השירים — רק ממשתתף מוביל בתחרות (לפי דירוגים) */
const getSongsPageFeatured = async (req, res) => {
  try {
    const topContest = await pickTopContestEntry();
    if (topContest) {
      return res.status(200).json({
        kind: "contest",
        contest: {
          _id: topContest._id,
          type: topContest.type,
          title: topContest.title || (topContest.type === "melody" ? "לחן בתחרות" : "יצירה בתחרות"),
          author: topContest.author || "",
          lyrics: topContest.lyrics || "",
          melodyAudioDataUrl: topContest.melodyAudioDataUrl || "",
          melodyPlayUrl:
            topContest.type === "melody" && topContest._id
              ? `/contest-submissions/${topContest._id}/melody-audio`
              : "",
        },
      });
    }

    return res.status(200).json({ kind: null });
  } catch (err) {
    sendErr(res, 500, err);
  }
};

const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().lean();
    res.status(200).json(await attachSongStats(songs));
  } catch (err) {
    sendErr(res, 500, err);
  }
};

const recordSongPlay = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "מזהה שיר לא תקין." });
    }
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    ).select("playCount");
    if (!song) return res.status(404).json({ message: "שיר לא נמצא." });
    return res.status(200).json({ playCount: song.playCount });
  } catch (err) {
    sendErr(res, 500, err);
  }
};

const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    res.status(200).json(song);
  } catch (err) {
    sendErr(res, 500, err);
  }
};

const addNewSong = async (req, res) => {
  try {
    const b = req.body && typeof req.body === "object" ? req.body : {};
    const title = String(b.title ?? "").trim();
    const lyrics = String(b.lyrics ?? "").trim();
    const songUrl = String(b.songUrl ?? "").trim();
    const artist = String(b.artist ?? "").trim();
    const duration = Number(b.duration);

    if (!title || !lyrics || !songUrl || !artist) {
      return res.status(400).json({ message: "חסרים כותרת, אמן, מילים או קישור לשיר." });
    }
    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(400).json({ message: "משך השיר חייב להיות מספר חיובי (שניות)." });
    }

    const categoryIds = normalizeCategoryIds(b);
    if (categoryIds.length === 0) {
      return res.status(400).json({ message: "נדרשת לפחות קטגוריה אחת (categoryIds)." });
    }

    const pid = b.publisherId != null ? String(b.publisherId).trim() : "";
    if (!pid || !mongoose.Types.ObjectId.isValid(pid)) {
      return res.status(400).json({
        message: "publisherId לא תקין — התחברי מחדש (מזהה משתמש חסר או לא תקין).",
      });
    }

    let publisherOid;
    let categoryOids;
    try {
      publisherOid = new mongoose.Types.ObjectId(pid);
      categoryOids = categoryIds.map(id => new mongoose.Types.ObjectId(id));
    } catch {
      return res.status(400).json({ message: "מזהה משתמש או קטגוריה לא בפורמט תקין." });
    }

    const categoryOidsDeduped = [...new Map(categoryOids.map(o => [String(o), o])).values()];

    const [publisherExists, categoryCount] = await Promise.all([
      User.exists({ _id: publisherOid }),
      Category.countDocuments({ _id: { $in: categoryOidsDeduped } }),
    ]);
    if (!publisherExists) {
      return res.status(400).json({
        message: "משתמש המפרסם לא נמצא במסד. התחברי מחדש (ייתכן שהחשבון נמחק או שהמזהה בדפדפן לא מעודכן).",
      });
    }
    if (categoryCount !== categoryOidsDeduped.length) {
      return res.status(400).json({
        message: "אחת הקטגוריות שבחרת אינה קיימת במסד. רענני את העמוד ובחרי קטגוריות מעודכנות.",
      });
    }

    const coverImageUrl = normalizeUploadPath(b.coverImageUrl);

    const payload = {
      title,
      lyrics,
      artist,
      songUrl,
      duration,
      categoryIds: categoryOidsDeduped,
      publisherId: publisherOid,
      ...(coverImageUrl ? { coverImageUrl } : {}),
    };

    const newSong = new Song(payload);
    await newSong.save();
    const songOut = newSong.toObject({ versionKey: false });
    return res.status(201).json({ message: "song added to DB", song: songOut });
  } catch (err) {
    console.error("[addNewSong]", err?.name, err?.code, err?.message, err?.stack);
    if (err?.name === "ValidationError") {
      const parts = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: parts.length ? parts.join(" ") : err.message });
    }
    if (err?.name === "CastError") {
      return res.status(400).json({ message: err.message || "שדה לא תואם לסכמה." });
    }
    const mongoCode = Number(err?.code);
    if (mongoCode === 11000 || mongoCode === 11001) {
      return res.status(409).json({ message: err.message || "ערך כבר קיים במערכת." });
    }
    if (mongoCode === 121) {
      return res.status(400).json({
        message:
          err.message ||
          "המסמך לא עבר ולידציה במסד הנתונים (למשל חוקי Schema ב-Atlas).",
      });
    }
    if (
      err?.name === "MongoNetworkError" ||
      err?.name === "MongoServerSelectionError" ||
      err?.cause?.code === "ECONNREFUSED"
    ) {
      return res.status(503).json({ message: "אין חיבור יציב למסד הנתונים. נסי שוב בעוד רגע." });
    }
    sendErr(res, 500, err);
  }
};

const updateSong = async (req, res) => {
  try {
    const patch = { ...stripSongPayload(req.body) };
    if (Object.prototype.hasOwnProperty.call(req.body, "categoryIds") || req.body.categoryId != null) {
      const categoryIds = normalizeCategoryIds(req.body);
      if (categoryIds.length === 0) {
        return res.status(400).json({ message: "נדרשת לפחות קטגוריה אחת (categoryIds)." });
      }
      try {
        patch.categoryIds = categoryIds.map(id => new mongoose.Types.ObjectId(id));
      } catch {
        return res.status(400).json({ message: "מזהה קטגוריה לא תקין." });
      }
    }
    if (patch.duration != null && patch.duration !== "") {
      patch.duration = Number(patch.duration);
      if (!Number.isFinite(patch.duration)) {
        return res.status(400).json({ message: "משך השיר חייב להיות מספר." });
      }
    }
    if (Object.prototype.hasOwnProperty.call(patch, "artist")) {
      patch.artist = String(patch.artist ?? "").trim();
    }
    let unsetCover = false;
    if (Object.prototype.hasOwnProperty.call(patch, "coverImageUrl")) {
      const cover = normalizeUploadPath(patch.coverImageUrl);
      if (!cover) {
        delete patch.coverImageUrl;
        unsetCover = true;
      } else {
        patch.coverImageUrl = cover;
      }
    }
    const updateOp = {};
    if (Object.keys(patch).length > 0) updateOp.$set = patch;
    if (unsetCover) updateOp.$unset = { coverImageUrl: "" };
    if (Object.keys(updateOp).length === 0) {
      return res.status(400).json({ message: "אין שדות לעדכון." });
    }
    const song = await Song.findByIdAndUpdate(req.params.id, updateOp, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ message: "song updated", updateSong: song });
  } catch (err) {
    if (err?.name === "ValidationError") {
      const parts = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: parts.length ? parts.join(" ") : err.message });
    }
    sendErr(res, 500, err);
  }
};

const deleteSong = async (req, res) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "song delete", deleteSong: song });
  } catch (err) {
    sendErr(res, 500, err);
  }
};

module.exports = {
  getAllSongs,
  getSongsPageFeatured,
  getSongById,
  recordSongPlay,
  addNewSong,
  updateSong,
  deleteSong,
};
