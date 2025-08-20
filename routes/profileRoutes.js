const express = require("express");
const { updateProfile, getProfileByUsername } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/", protect, updateProfile);
router.get("/:username", getProfileByUsername);

module.exports = router;