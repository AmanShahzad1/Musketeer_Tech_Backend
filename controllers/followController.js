const Follow = require("../models/Follow");
const User = require("../models/User");


exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === userId) {
      return res.status(400).json({ msg: "You cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      follower: req.user.id,
      following: userId
    });

    if (existingFollow) {
      return res.status(400).json({ msg: "Already following this user" });
    }

    // Create follow relationship
    const follow = new Follow({
      follower: req.user.id,
      following: userId
    });

    await follow.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('newFollower', {
      followerId: req.user.id,
      followerName: req.user.firstName + ' ' + req.user.lastName,
      followerUsername: req.user.username
    });

    res.json({
      success: true,
      data: { follow }
    });
  } catch (err) {
    console.error("Follow user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Unfollow a user
// @route   DELETE /api/follow/:userId
// @access  Private
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const follow = await Follow.findOneAndDelete({
      follower: req.user.id,
      following: userId
    });

    if (!follow) {
      return res.status(404).json({ msg: "Follow relationship not found" });
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('userUnfollowed', {
      followerId: req.user.id
    });

    res.json({
      success: true,
      data: { message: "Unfollowed successfully" }
    });
  } catch (err) {
    console.error("Unfollow user error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.getFollowers = async (req, res) => {
  try {
    const followers = await Follow.find({ following: req.user.id })
      .populate('follower', 'username firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { followers }
    });
  } catch (err) {
    console.error("Get followers error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get following list
// @route   GET /api/follow/following
// @access  Private
exports.getFollowing = async (req, res) => {
  try {
    const following = await Follow.find({ follower: req.user.id })
      .populate('following', 'username firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { following }
    });
  } catch (err) {
    console.error("Get following error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.checkFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const follow = await Follow.findOne({
      follower: req.user.id,
      following: userId
    });

    res.json({
      success: true,
      data: { isFollowing: !!follow }
    });
  } catch (err) {
    console.error("Check follow status error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};