const express = require("express");
const { 
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus
} = require("../controllers/followController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

router.post("/:userId", followUser);
router.delete("/:userId", unfollowUser);
router.get("/followers", getFollowers);
router.get("/following", getFollowing);
router.get("/check/:userId", checkFollowStatus);

module.exports = router;