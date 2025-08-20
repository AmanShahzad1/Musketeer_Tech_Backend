const User = require("../models/User");
const Post = require("../models/Post");


exports.searchUsers = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const searchQuery = query.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create regex pattern for case-insensitive search
    const regex = new RegExp(searchQuery, 'i');

    // Search in username, firstName, and lastName
    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } }
      ]
    })
    .select("-password -email")
    .sort({ username: 1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await User.countDocuments({
      $or: [
        { username: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } }
      ]
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalUsers: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.searchPosts = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 10 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const searchQuery = query.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create regex pattern for case-insensitive search
    const regex = new RegExp(searchQuery, 'i');

    // Search in post text
    const posts = await Post.find({
      text: { $regex: regex }
    })
    .populate("user", "username firstName lastName profilePicture")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Post.countDocuments({
      text: { $regex: regex }
    });

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalPosts: total,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (err) {
    console.error("Search posts error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};


exports.globalSearch = async (req, res) => {
  try {
    const { q: query, page = 1, limit = 5 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ msg: "Search query is required" });
    }

    const searchQuery = query.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Create regex pattern for case-insensitive search
    const regex = new RegExp(searchQuery, 'i');

    // Search users
    const users = await User.find({
      $or: [
        { username: { $regex: regex } },
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } }
      ]
    })
    .select("-password -email")
    .sort({ username: 1 })
    .limit(parseInt(limit));

    // Search posts
    const posts = await Post.find({
      text: { $regex: regex }
    })
    .populate("user", "username firstName lastName profilePicture")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

    // Combine and sort results by relevance (posts first, then users)
    const results = {
      users: users.slice(0, 3), // Limit users to 3 for global search
      posts: posts.slice(0, 3), // Limit posts to 3 for global search
      totalResults: users.length + posts.length
    };

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error("Global search error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};