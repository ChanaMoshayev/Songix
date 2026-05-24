const express = require("express");
const artistsController = require("../controllers/artistsController");
const artistAvatarMulter = require("../middleware/artistAvatarMulter");

const router = express.Router();

function multerSingle(field, maxMb) {
  return (req, res, next) => {
    artistAvatarMulter.single(field)(req, res, err => {
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

router.get("/", artistsController.listArtists);
router.post("/save", artistsController.saveArtist);
router.post("/upload-avatar", multerSingle("avatar", 8), artistsController.uploadArtistAvatar);
router.post("/remove-avatar", artistsController.removeArtistAvatar);
router.post("/delete", artistsController.deleteArtist);
router.delete("/:id", artistsController.deleteArtist);

module.exports = router;
