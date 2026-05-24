/**
 * מריץ פעם אחת: מעתיק categoryId ישן ל־categoryIds ומסיר את categoryId.
 * הרצה: מתיקיית server — node scripts/migrateSongCategoryIds.js
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/songLyrics";

async function main() {
  await mongoose.connect(mongoURI);
  const coll = mongoose.connection.collection("songs");

  const r1 = await coll.updateMany(
    {
      $or: [
        { categoryIds: { $exists: false } },
        { categoryIds: null },
        { categoryIds: { $size: 0 } },
      ],
      categoryId: { $exists: true, $ne: null },
    },
    [{ $set: { categoryIds: ["$categoryId"] } }]
  );
  console.log("הועתק categoryId → categoryIds:", r1.matchedCount, "מסמכים");

  const r2 = await coll.updateMany({ categoryId: { $exists: true } }, { $unset: { categoryId: "" } });
  console.log("הוסר שדה categoryId ישן:", r2.modifiedCount, "מסמכים");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
