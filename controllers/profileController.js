const User = require("../models/User");

// @desc    Update user profile
// @route   PATCH /api/profile
exports.updateProfile = async (req, res) => {
  const { name, bio, profilePicture, interests } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, profilePicture, interests },
      { new: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get public profile by username
// @route   GET /api/profile/:username
exports.getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -email -createdAt -updatedAt -__v');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};