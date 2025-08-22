const express = require("express");
const { updateProfile, getProfileByUsername, uploadProfilePicture } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.patch("/", protect, updateProfile);
router.get("/:username", getProfileByUsername);
router.post("/picture", protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;