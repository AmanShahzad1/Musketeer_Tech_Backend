const User = require("../models/User");

// @desc    Update user profile
// @route   PATCH /api/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, bio, interests, profilePicture } = req.body;

  try {
    // Validate interests
    if (!interests || interests.length === 0) {
      return res.status(400).json({ msg: "At least one interest is required" });
    }

    // Check if username is being changed and if it's unique
    if (req.body.username) {
      const existingUser = await User.findOne({ 
        username: req.body.username,
        _id: { $ne: req.user.id }
      });
      if (existingUser) {
        return res.status(400).json({ msg: "Username already exists" });
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        bio,
        interests,
        ...(profilePicture && { profilePicture }),
        ...(req.body.username && { username: req.body.username })
      },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get profile by username
// @route   GET /api/profile/:username
// @access  Public
exports.getProfileByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select("-password")
      .select("-email");

    if (!user) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Upload profile picture
// @route   POST /api/profile/picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // Update user's profile picture path
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: req.file.path },
      { new: true }
    ).select("-password");

    res.json({
      msg: "Profile picture uploaded successfully",
      profilePicture: req.file.path
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};