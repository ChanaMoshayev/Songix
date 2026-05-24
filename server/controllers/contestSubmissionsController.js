const mongoose = require("mongoose");
const ContestSubmission = require("../models/contestSubmissionModel");
const ContestRating = require("../models/contestRatingModel");
const Song = require("../models/songsModel");
const User = require("../models/usersModel");
const Category = require("../models/categoriesModel");
const { assertAdmin } = require("../utils/assertAdmin");
const { saveDataUrlAudio } = require("../utils/saveDataUrlAudio");
const { normalizeCategoryIds } = require("../utils/songCategoryIds");
const { normalizeUploadPath } = require("../utils/normalizeMediaUrl");

const ACTIVE_CONTEST_FILTER = {
  $or: [{ promotedSongId: null }, { promotedSongId: { $exists: false } }],
};

async function attachRatingsToSubmissions(submissions, { viewerUserId, includeScores }) {
  if (!submissions.length) return [];

  const ids = submissions.map(s => s._id);
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
  const scoreById = new Map(agg.map(row => [String(row._id), row]));

  let myBySubmission = new Map();
  if (viewerUserId && mongoose.Types.ObjectId.isValid(viewerUserId)) {
    const mine = await ContestRating.find({
      submissionId: { $in: ids },
      raterUserId: new mongoose.Types.ObjectId(viewerUserId),
    }).lean();
    myBySubmission = new Map(mine.map(r => [String(r.submissionId), r.stars]));
  }

  return submissions.map(doc => {
    const s = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
    const key = String(s._id);
    const scores = scoreById.get(key);
    s.myStars = myBySubmission.get(key) || 0;
    if (includeScores) {
      s.totalPoints = scores?.totalPoints ?? 0;
      s.ratingsCount = scores?.ratingsCount ?? 0;
    }
    return s;
  });
}

const getContestStats = async (_req, res) => {
  try {
    const [publishedSongs, activeSubmissions, usersCount, ratingsCount] = await Promise.all([
      Song.countDocuments(),
      ContestSubmission.countDocuments(ACTIVE_CONTEST_FILTER),
      User.countDocuments(),
      ContestRating.countDocuments(),
    ]);
    return res.status(200).json({
      publishedSongs,
      activeSubmissions,
      usersCount,
      ratingsCount,
    });
  } catch (err) {
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

const createSubmission = async (req, res) => {
  try {
    const body = req.body || {};
    const type = String(body.type || "");
    if (type !== "lyrics" && type !== "melody") {
      return res.status(400).json({ message: "סוג הגשה לא תקין." });
    }
    if (!body.author || String(body.author).trim().length < 1) {
      return res.status(400).json({ message: "חסר מזהה מחבר." });
    }

    if (type === "lyrics") {
      if (!String(body.title || "").trim() || !String(body.lyrics || "").trim()) {
        return res.status(400).json({ message: "חובה כותרת ומילים." });
      }
    }
    let melodyAudioDataUrl = body.melodyAudioDataUrl;
    if (type === "melody") {
      if (!String(body.title || "").trim()) {
        return res.status(400).json({ message: "חובה שם ללחן." });
      }
      const rawMelody = String(melodyAudioDataUrl || "").trim();
      if (!rawMelody) {
        return res.status(400).json({ message: "חובה להעלות קובץ לחן." });
      }
      if (rawMelody.startsWith("data:")) {
        const savedPath = saveDataUrlAudio(rawMelody);
        if (!savedPath) {
          return res.status(400).json({ message: "פורמט קובץ האודיו לא נתמך." });
        }
        melodyAudioDataUrl = savedPath;
      }
    }

    const doc = await ContestSubmission.create({
      type,
      title: body.title,
      lyrics: body.lyrics,
      melodyAudioDataUrl,
      notes: body.notes,
      author: String(body.author).trim(),
      authorUserId: body.authorUserId || undefined,
      authorEmail: body.authorEmail ? String(body.authorEmail).trim().toLowerCase() : undefined,
    });

    return res.status(201).json(doc);
  } catch (err) {
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

const getAllSubmissions = async (req, res) => {
  try {
    const viewerUserId = String(req.query.viewerUserId || "").trim();
    const adminUserId = String(req.query.adminUserId || "").trim();
    const includeScores = adminUserId ? await assertAdmin(adminUserId) : false;

    const list = await ContestSubmission.find(ACTIVE_CONTEST_FILTER).sort({ createdAt: -1 }).lean();
    const enriched = await attachRatingsToSubmissions(list, { viewerUserId, includeScores });
    const payload = enriched.map(s => {
      const out = { ...s };
      delete out.baseSongId;
      delete out.baseSongTitle;
      if (s.type === "melody") {
        const rawMelody = String(s.melodyAudioDataUrl || "").trim();
        const hasMelodyAudio = Boolean(rawMelody);
        out.hasMelodyAudio = hasMelodyAudio;
        if (hasMelodyAudio) {
          out.melodyPlayUrl = rawMelody.startsWith("/uploads/")
            ? rawMelody
            : s._id
              ? `/contest-submissions/${s._id}/melody-audio`
              : "";
        }
        delete out.melodyAudioDataUrl;
      }
      if (s.type === "lyrics") {
        out.hasLyrics = Boolean(String(s.lyrics || "").trim());
      }
      return out;
    });
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

const rateSubmission = async (req, res) => {
  try {
    const submissionId = req.params.id;
    const raterUserId = String(req.body?.raterUserId || "").trim();
    const stars = Number(req.body?.stars);

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "מזהה הגשה לא תקין." });
    }
    if (!mongoose.Types.ObjectId.isValid(raterUserId)) {
      return res.status(400).json({ message: "יש להתחבר כדי לדרג." });
    }
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "דירוג חייב להיות בין 1 ל-5." });
    }

    const submission = await ContestSubmission.findOne({
      _id: submissionId,
      $and: [ACTIVE_CONTEST_FILTER],
    });
    if (!submission) {
      return res.status(404).json({ message: "הגשה לא נמצאה או שכבר פורסמה במערכת." });
    }

    const rating = await ContestRating.findOneAndUpdate(
      { submissionId, raterUserId },
      { stars },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const agg = await ContestRating.aggregate([
      { $match: { submissionId: new mongoose.Types.ObjectId(submissionId) } },
      { $group: { _id: null, totalPoints: { $sum: "$stars" }, ratingsCount: { $sum: 1 } } },
    ]);
    const totals = agg[0] || { totalPoints: 0, ratingsCount: 0 };

    const payload = { message: "דירוג נשמר", myStars: rating.stars };
    if (await assertAdmin(raterUserId)) {
      payload.totalPoints = totals.totalPoints;
      payload.ratingsCount = totals.ratingsCount;
    }
    return res.status(200).json(payload);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "כבר דירגת הגשה זו." });
    }
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

const promoteSubmission = async (req, res) => {
  try {
    const adminUserId = String(req.body?.adminUserId || "").trim();
    if (!(await assertAdmin(adminUserId))) {
      return res.status(403).json({ message: "רק מנהל מערכת יכול להוסיף שיר למערכת." });
    }

    const submissionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return res.status(400).json({ message: "מזהה הגשה לא תקין." });
    }

    const sub = await ContestSubmission.findById(submissionId);
    if (!sub) return res.status(404).json({ message: "הגשה לא נמצאה." });
    if (sub.promotedSongId) {
      return res.status(400).json({ message: "שיר זה כבר נוסף למערכת." });
    }

    const b = req.body || {};
    const artist = String(b.artist ?? sub.author ?? "").trim();
    const duration = Number(b.duration);
    const categoryIds = normalizeCategoryIds(b);
    let songUrl = normalizeUploadPath(b.songUrl);

    if (!artist) return res.status(400).json({ message: "חסר שם אמן." });
    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(400).json({ message: "משך השיר חייב להיות מספר חיובי (שניות)." });
    }
    if (categoryIds.length === 0) {
      return res.status(400).json({ message: "נדרשת לפחות קטגוריה אחת." });
    }

    let title = "";
    let lyrics = "";

    if (sub.type === "lyrics") {
      title = String(sub.title || "").trim();
      lyrics = String(sub.lyrics || "").trim();
      if (!title || !lyrics) {
        return res.status(400).json({ message: "הגשת מילים חסרה כותרת או מילים." });
      }
      if (!songUrl) {
        return res.status(400).json({ message: "נדרש קישור או קובץ שיר (songUrl) לפרסום במערכת." });
      }
    } else if (sub.type === "melody") {
      title = String(b.title || sub.title || "").trim();
      lyrics = String(b.lyrics || sub.notes || "לחן שהוגש לתחרות").trim();
      if (!title) return res.status(400).json({ message: "חסרה כותרת לשיר." });
      if (!songUrl && sub.melodyAudioDataUrl) {
        songUrl = saveDataUrlAudio(sub.melodyAudioDataUrl);
      }
      if (!songUrl) {
        return res.status(400).json({ message: "לא ניתן לשמור את קובץ הלחן. העלי קישור שיר ידנית." });
      }
    } else {
      return res.status(400).json({ message: "סוג הגשה לא נתמך." });
    }

    const publisherRaw = sub.authorUserId || adminUserId;
    if (!mongoose.Types.ObjectId.isValid(String(publisherRaw))) {
      return res.status(400).json({ message: "מזהה מפרסם לא תקין." });
    }
    const publisherOid = new mongoose.Types.ObjectId(String(publisherRaw));
    const categoryOids = categoryIds.map(id => new mongoose.Types.ObjectId(id));

    const [publisherExists, categoryCount] = await Promise.all([
      User.exists({ _id: publisherOid }),
      Category.countDocuments({ _id: { $in: categoryOids } }),
    ]);
    if (!publisherExists) {
      return res.status(400).json({ message: "משתמש המפרסם לא נמצא במסד." });
    }
    if (categoryCount !== categoryOids.length) {
      return res.status(400).json({ message: "אחת הקטגוריות אינה קיימת." });
    }

    const newSong = await Song.create({
      title,
      lyrics,
      artist,
      songUrl: normalizeUploadPath(songUrl) || songUrl,
      duration,
      categoryIds: categoryOids,
      publisherId: publisherOid,
      contentType: sub.type === "melody" ? "melody" : "song",
    });

    sub.promotedSongId = newSong._id;
    sub.promotedAt = new Date();
    await sub.save();

    return res.status(201).json({
      message: "השיר נוסף למערכת ויצא מרשימת התחרות",
      song: newSong,
      submission: sub,
    });
  } catch (err) {
    if (err?.name === "ValidationError") {
      const parts = Object.values(err.errors || {}).map(e => e.message);
      return res.status(400).json({ message: parts.join(" ") || err.message });
    }
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

const getMelodyAudio = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "מזהה לא תקין." });
    }
    const sub = await ContestSubmission.findById(req.params.id).select("type melodyAudioDataUrl").lean();
    if (!sub || sub.type !== "melody") {
      return res.status(404).json({ message: "לחן לא נמצא." });
    }
    let raw = String(sub.melodyAudioDataUrl || "").trim();
    if (!raw) return res.status(404).json({ message: "אין קובץ לחן." });

    if (raw.startsWith("data:")) {
      const savedPath = saveDataUrlAudio(raw);
      if (savedPath) {
        await ContestSubmission.updateOne({ _id: sub._id }, { $set: { melodyAudioDataUrl: savedPath } });
        raw = savedPath;
      }
    }

    if (raw.startsWith("/uploads/")) {
      return res.redirect(302, raw);
    }

    const match = /^data:([^;]+);base64,(.+)$/i.exec(raw);
    if (!match) {
      return res.status(400).json({ message: "פורמט אודיו לא נתמך." });
    }
    const mime = match[1] || "audio/webm";
    const buf = Buffer.from(match[2], "base64");
    res.setHeader("Content-Type", mime);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.send(buf);
  } catch (err) {
    return res.status(500).json({ message: String(err?.message || err) });
  }
};

module.exports = {
  getContestStats,
  createSubmission,
  getAllSubmissions,
  rateSubmission,
  promoteSubmission,
  getMelodyAudio,
};
