const Post = require("../models/Post");
const fs = require('fs');
const path = require('path');

// Helper function for error responses
const handleError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    status: "error",
    message
  });
};

// @desc    Create a post
// @route   POST /api/posts
exports.createPost = async (req, res) => {
  try {
    console.log("Requesting");
    const { text, userId } = req.body;
    //const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!text || !userId) {
      return handleError(res, 400, "Text and user ID are required");
    }

    const post = await Post.create({
      text,
      image,
      user: userId
    });

    await post.populate('user', 'username profilePicture');

    res.status(201).json({
      status: "success",
      data: {
        post
      }
    });
  } catch (err) {
    handleError(res, 500, "Server error");
  }
};

// @desc    Get feed posts (paginated)
// @route   GET /api/posts
exports.getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profilePicture");

    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      status: "success",
      results: posts.length,
      total: totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      data: {
        posts
      }
    });
  } catch (err) {
    handleError(res, 500, "Server error");
  }
};

// @desc    Get specific post
// @route   GET /api/posts/:id
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username profilePicture")
      .populate("comments");

    if (!post) {
      return handleError(res, 404, "No post found with that ID");
    }

    res.status(200).json({
      status: "success",
      data: {
        post
      }
    });
  } catch (err) {
    handleError(res, 500, "Server error");
  }
};

// @desc    Delete own post
// @route   DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return handleError(res, 400, "User ID is required");
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return handleError(res, 404, "No post found with that ID");
    }

    if (post.user.toString() !== userId) {
      return handleError(res, 403, "Not authorized to delete this post");
    }

    if (post.image) {
      const imagePath = path.join(__dirname, '../public', post.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await post.remove();

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    handleError(res, 500, "Server error");
  }
};

// @desc    Get user's posts
// @route   GET /api/users/:userId/posts
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ user: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username profilePicture");

    const totalPosts = await Post.countDocuments({ user: req.params.userId });

    res.status(200).json({
      status: "success",
      results: posts.length,
      total: totalPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      data: {
        posts
      }
    });
  } catch (err) {
    handleError(res, 500, "Server error");
  }
};