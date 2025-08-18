const express = require("express");
const { updateProfile, getPublicProfile } = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/", protect, updateProfile);
router.get('/:username', getPublicProfile);

module.exports = router;