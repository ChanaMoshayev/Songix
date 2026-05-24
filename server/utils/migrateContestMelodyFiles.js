const ContestSubmission = require("../models/contestSubmissionModel");
const { saveDataUrlAudio } = require("./saveDataUrlAudio");

/** מעביר לחנים ישנים מ-data URL במסד לקובץ ב-uploads (השמעה מהירה) */
async function migrateContestMelodyDataUrlsToFiles() {
  const list = await ContestSubmission.find({
    type: "melody",
    melodyAudioDataUrl: { $regex: /^data:/i },
  })
    .select("_id melodyAudioDataUrl")
    .lean();

  let migrated = 0;
  for (const sub of list) {
    const savedPath = saveDataUrlAudio(sub.melodyAudioDataUrl);
    if (!savedPath) continue;
    await ContestSubmission.updateOne({ _id: sub._id }, { $set: { melodyAudioDataUrl: savedPath } });
    migrated += 1;
  }

  if (migrated > 0) {
    console.log(`[contest-melody] הועברו ${migrated} לחנים ממסד לקבצי uploads.`);
  }
  return migrated;
}

module.exports = { migrateContestMelodyDataUrlsToFiles };
