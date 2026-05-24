const mongoose = require("mongoose");
const Song = require("../models/songsModel");
const ArtistProfile = require("../models/artistProfileModel");
const { deriveArtistFromSongUrl } = require("../utils/deriveArtistFromSongUrl");
const { parseArtistNames } = require("../utils/parseArtistNames");
const { assertAdmin } = require("../utils/assertAdmin");
const { artistNameKey } = require("../utils/artistNameKey");
const { normalizeUploadPath } = require("../utils/normalizeMediaUrl");
const { resolveErrorMessage } = require("../utils/mongoErrors");

function collectArtistNamesFromSongs(songs) {
  const map = new Map();
  for (const song of songs) {
    const fromDb = String(song.artist || "").trim();
    let combined = fromDb;
    if (!combined) combined = deriveArtistFromSongUrl(song.songUrl) || "";
    const names = parseArtistNames(combined);
    for (const name of names) {
      const key = artistNameKey(name);
      if (!map.has(key)) map.set(key, { name, count: 0 });
      map.get(key).count += 1;
    }
  }
  return map;
}

/** מוחק פרופילים משולבים (שם כפול) — לא מוסיף זמרים משירים */
async function pruneInvalidProfiles() {
  const profiles = await ArtistProfile.find().lean();
  for (const p of profiles) {
    if (parseArtistNames(p.displayName).length > 1) {
      await ArtistProfile.deleteOne({ _id: p._id });
    }
  }
}

function mapProfileRow(p, fromSongs) {
  return {
    id: String(p._id),
    name: p.displayName,
    nameKey: p.nameKey,
    songCount: fromSongs.get(p.nameKey)?.count || 0,
    profileImageUrl: p.profileImageUrl || "",
    featuredInStrip: Boolean(p.featuredInStrip),
  };
}

function isValidSingleArtistProfile(p) {
  return parseArtistNames(p.displayName).length <= 1;
}

const listArtists = async (req, res) => {
  try {
    const stripOnly = req.query.stripOnly === "1" || req.query.stripOnly === "true";
    const songs = await Song.find().select("artist songUrl").lean();
    const fromSongs = collectArtistNamesFromSongs(songs);

    try {
      await pruneInvalidProfiles();
    } catch (pruneErr) {
      console.error("[artists] prune:", pruneErr?.message);
    }

    const profiles = await ArtistProfile.find().lean();

    if (stripOnly) {
      const out = profiles
        .filter(
          p =>
            isValidSingleArtistProfile(p) &&
            p.featuredInStrip &&
            String(p.profileImageUrl || "").trim()
        )
        .map(p => mapProfileRow(p, fromSongs));
      out.sort((a, b) => a.name.localeCompare(b.name, "he"));
      return res.status(200).json(out);
    }

    const out = profiles
      .filter(isValidSingleArtistProfile)
      .map(p => mapProfileRow(p, fromSongs));
    out.sort((a, b) => a.name.localeCompare(b.name, "he"));
    return res.status(200).json(out);
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

/** שמירת פרופיל זמר (הוספה / עדכון שם) — מנהל */
const saveArtist = async (req, res) => {
  try {
    const adminUserId = String(req.body?.adminUserId || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    const profileImageUrl = req.body?.profileImageUrl
      ? normalizeUploadPath(req.body.profileImageUrl)
      : undefined;

    if (!(await assertAdmin(adminUserId))) {
      return res.status(403).json({ message: "רק מנהל יכול לנהל זמרים." });
    }
    if (!displayName) {
      return res.status(400).json({ message: "חסר שם זמר." });
    }

    const key = artistNameKey(displayName);
    const update = { displayName, featuredInStrip: true };
    if (profileImageUrl !== undefined) update.profileImageUrl = profileImageUrl;

    const doc = await ArtistProfile.findOneAndUpdate(
      { nameKey: key },
      update,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ message: "הזמר נשמר.", artist: doc });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const uploadArtistAvatar = async (req, res) => {
  try {
    const adminUserId = String(req.body?.adminUserId || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    if (!(await assertAdmin(adminUserId))) {
      return res.status(403).json({ message: "רק מנהל יכול לעדכן תמונת זמר." });
    }
    if (!displayName) {
      return res.status(400).json({ message: "חסר שם זמר." });
    }
    if (!req.file) {
      return res.status(400).json({ message: "לא הועלה קובץ." });
    }

    const key = artistNameKey(displayName);
    const profileImageUrl = normalizeUploadPath(`/uploads/${req.file.filename}`);
    const doc = await ArtistProfile.findOneAndUpdate(
      { nameKey: key },
      { displayName, profileImageUrl },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({
        message: "הזמר לא ברשימה — שמרי קודם «שמירת זמר» ואז העלי תמונה.",
      });
    }
    return res.status(200).json({
      message: "תמונת הזמר עודכנה.",
      artist: {
        name: doc.displayName,
        nameKey: doc.nameKey,
        profileImageUrl: doc.profileImageUrl,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const deleteArtist = async (req, res) => {
  try {
    const adminUserId = String(req.body?.adminUserId || "").trim();
    const id = String(req.body?.id || req.params?.id || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    const nameKeyBody = String(req.body?.nameKey || "").trim();

    if (!(await assertAdmin(adminUserId))) {
      return res.status(403).json({ message: "רק מנהל יכול למחוק זמרים." });
    }
    if (!id && !displayName && !nameKeyBody) {
      return res.status(400).json({ message: "חסר מזהה או שם זמר." });
    }

    let doc = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      doc = await ArtistProfile.findByIdAndDelete(id);
    }
    if (!doc) {
      const key = nameKeyBody || artistNameKey(displayName);
      if (key) doc = await ArtistProfile.findOneAndDelete({ nameKey: key });
    }
    if (!doc && displayName) {
      doc = await ArtistProfile.findOneAndDelete({ displayName });
    }
    if (!doc) {
      return res.status(404).json({ message: "הזמר לא נמצא ברשימה." });
    }
    return res.status(200).json({
      message: "הזמר הוסר מהרשימה.",
      id: String(doc._id),
      nameKey: doc.nameKey,
    });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

const removeArtistAvatar = async (req, res) => {
  try {
    const adminUserId = String(req.body?.adminUserId || "").trim();
    const displayName = String(req.body?.displayName || "").trim();
    if (!(await assertAdmin(adminUserId))) {
      return res.status(403).json({ message: "רק מנהל יכול להסיר תמונת זמר." });
    }
    if (!displayName) {
      return res.status(400).json({ message: "חסר שם זמר." });
    }
    const key = artistNameKey(displayName);
    const doc = await ArtistProfile.findOneAndUpdate(
      { nameKey: key },
      { profileImageUrl: "" },
      { new: true }
    );
    if (!doc) {
      return res.status(404).json({ message: "פרופיל זמר לא נמצא." });
    }
    return res.status(200).json({ message: "תמונת הזמר הוסרה.", artist: doc });
  } catch (err) {
    return res.status(500).json({ message: resolveErrorMessage(err) });
  }
};

module.exports = {
  listArtists,
  saveArtist,
  uploadArtistAvatar,
  removeArtistAvatar,
  deleteArtist,
};
