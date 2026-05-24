function uploadSongAudio(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "לא הועלה קובץ." });
  }
  const PORT = process.env.PORT || 5000;
  const base = String(process.env.PUBLIC_SERVER_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
  const songUrl = `${base}/uploads/${req.file.filename}`;
  return res.status(200).json({ songUrl });
}

module.exports = { uploadSongAudio };
