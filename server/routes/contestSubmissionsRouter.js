const express = require("express");
const contestSubmissionsController = require("../controllers/contestSubmissionsController");

const router = express.Router();

router.get("/stats", contestSubmissionsController.getContestStats);
router.get("/", contestSubmissionsController.getAllSubmissions);
router.post("/", contestSubmissionsController.createSubmission);
router.get("/:id/melody-audio", contestSubmissionsController.getMelodyAudio);
router.post("/:id/rate", contestSubmissionsController.rateSubmission);
router.post("/:id/promote", contestSubmissionsController.promoteSubmission);

module.exports = router;
