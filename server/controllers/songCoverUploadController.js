const { normalizeUploadPath } = require("../utils/normalizeMediaUrl");

function uploadSongCover(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "לא הועלה קובץ." });
  }
  const coverImageUrl = normalizeUploadPath(`/uploads/${req.file.filename}`);
  return res.status(200).json({ coverImageUrl });
}

module.exports = { uploadSongCover };
