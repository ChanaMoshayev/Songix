/**
 * מוחק את כל פרופילי הזמרים חוץ מהרשימה הקבועה, ומסמן אותם לפס באתר.
 * הרצה: מתיקיית server — node scripts/resetFeaturedArtists.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const ArtistProfile = require("../models/artistProfileModel");
const { artistNameKey } = require("../utils/artistNameKey");

const KEEP_DISPLAY_NAMES = ["איציק אורלב", "אביעד דרף", "אבי אילסון"];

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/songLyrics";

async function main() {
  await mongoose.connect(mongoURI);
  const allowedKeys = KEEP_DISPLAY_NAMES.map(artistNameKey);

  await ArtistProfile.updateMany({}, { $set: { featuredInStrip: false } });

  const del = await ArtistProfile.deleteMany({ nameKey: { $nin: allowedKeys } });
  console.log("נמחקו פרופילי זמרים:", del.deletedCount);

  for (const displayName of KEEP_DISPLAY_NAMES) {
    const nameKey = artistNameKey(displayName);
    const doc = await ArtistProfile.findOneAndUpdate(
      { nameKey },
      { $set: { displayName, featuredInStrip: true } },
      { upsert: true, new: true, setDefaultsOnInsert: { profileImageUrl: "" } }
    );
    console.log("נשמר לפס:", doc.displayName, doc.profileImageUrl ? "(יש תמונה)" : "(ללא תמונה)");
  }

  const remaining = await ArtistProfile.find().lean();
  console.log("סה״כ במערכת:", remaining.length, "זמרים");
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
