const express = require("express");
const songsController = require("../controllers/songsController");
const songAudioUploadController = require("../controllers/songAudioUploadController");
const songCoverUploadController = require("../controllers/songCoverUploadController");
const multerAudio = require("../middleware/songAudioMulter");
const multerCover = require("../middleware/songCoverMulter");

const songsRouter = express.Router();

songsRouter.get("/", songsController.getAllSongs);
songsRouter.get("/featured", songsController.getSongsPageFeatured);

function multerSingle(multerInstance, field, maxMb) {
  return (req, res, next) => {
    multerInstance.single(field)(req, res, err => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: `הקובץ גדול מדי (מקסימום ${maxMb}MB).` });
        }
        return res.status(400).json({ message: err.message || String(err) });
      }
      next();
    });
  };
}

songsRouter.post("/upload-audio", multerSingle(multerAudio, "audio", 35), songAudioUploadController.uploadSongAudio);
songsRouter.post("/upload-cover", multerSingle(multerCover, "cover", 8), songCoverUploadController.uploadSongCover);

songsRouter.post("/:id/play", songsController.recordSongPlay);
songsRouter.get("/:id", songsController.getSongById);
songsRouter.post("/", songsController.addNewSong);
songsRouter.put("/:id", songsController.updateSong);
songsRouter.delete("/:id", songsController.deleteSong);

module.exports = songsRouter;