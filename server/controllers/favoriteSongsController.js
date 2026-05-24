const mongoose = require("mongoose");
const FavoriteSong = require("../models/favoriteSongsModel");
const { resolveErrorMessage } = require("../utils/mongoErrors");

function parseUserAndSongIds(bodyOrQuery) {
  const src = bodyOrQuery || {};
  const userId = String(src.userId ?? src.user ?? "").trim();
  const songId = String(src.songId ?? src.song ?? "").trim();
  if (!userId || !songId) {
    return { error: "חסרים מזהה משתמש או מזהה שיר." };
  }
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(songId)) {
    return { error: "מזהה משתמש או שיר לא תקין." };
  }
  return { userId, songId };
}

const getFavoriteStatus = async (req, res) => {
  try {
    const parsed = parseUserAndSongIds(req.query);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const doc = await FavoriteSong.findOne({ user: parsed.userId, song: parsed.songId }).select("_id");
    return res.status(200).json({ isFavorite: Boolean(doc), favoriteId: doc?._id ?? null });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const getFavoritesByUser = async (req, res) => {
  try {
    const userId = String(req.params.userId || "").trim();
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "מזהה משתמש לא תקין." });
    }
    const rows = await FavoriteSong.find({ user: userId })
      .populate("song")
      .sort({ createdAt: -1 })
      .lean();
    const songs = rows.map(r => r.song).filter(s => s && s._id);
    return res.status(200).json({
      songIds: songs.map(s => String(s._id)),
      favorites: rows.map(({ _id, song, createdAt }) => ({
        _id,
        song: song?._id,
        createdAt,
      })),
      songs,
    });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const parsed = parseUserAndSongIds(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const filter = { user: parsed.userId, song: parsed.songId };
    const existing = await FavoriteSong.findOne(filter);
    if (existing) {
      await FavoriteSong.deleteOne({ _id: existing._id });
      return res.status(200).json({ isFavorite: false, message: "הוסר מהמועדפים." });
    }

    const created = await FavoriteSong.create(filter);
    return res.status(201).json({
      isFavorite: true,
      favoriteId: created._id,
      message: "נוסף למועדפים.",
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(200).json({ isFavorite: true, message: "כבר במועדפים." });
    }
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const getAllFavoritesSongs = async (req, res) => {
  try {
    const favoriteSongs = await FavoriteSong.find().sort({ createdAt: -1 });
    res.status(200).json(favoriteSongs);
  } catch (err) {
    res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const getFavoriteSongById = async (req, res) => {
  try {
    const favoriteSong = await FavoriteSong.findById(req.params.id);
    if (!favoriteSong) {
      return res.status(404).json({ message: "רשומת מועדף לא נמצאה." });
    }
    res.status(200).json(favoriteSong);
  } catch (err) {
    res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const addNewFavoriteSong = async (req, res) => {
  try {
    const parsed = parseUserAndSongIds(req.body);
    if (parsed.error) return res.status(400).json({ message: parsed.error });

    const created = await FavoriteSong.create({ user: parsed.userId, song: parsed.songId });
    res.status(201).json({ message: "נוסף למועדפים.", favorite: created });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "השיר כבר במועדפים." });
    }
    res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const deleteFavoriteSong = async (req, res) => {
  try {
    const parsed = parseUserAndSongIds(req.query.userId ? req.query : req.body);
    if (!parsed.error) {
      const deleted = await FavoriteSong.findOneAndDelete({ user: parsed.userId, song: parsed.songId });
      if (deleted) {
        return res.status(200).json({ message: "הוסר מהמועדפים.", isFavorite: false });
      }
    }

    const deletedFavoriteSong = await FavoriteSong.findByIdAndDelete(req.params.id);
    if (!deletedFavoriteSong) {
      return res.status(404).json({ message: "רשומת מועדף לא נמצאה." });
    }
    res.status(200).json({ message: "הוסר מהמועדפים.", isFavorite: false });
  } catch (err) {
    res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

module.exports = {
  getFavoriteStatus,
  getFavoritesByUser,
  toggleFavorite,
  getAllFavoritesSongs,
  getFavoriteSongById,
  addNewFavoriteSong,
  deleteFavoriteSong,
};
