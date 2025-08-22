const Post = require("../models/Post");
const User = require("../models/User");

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ msg: "Post text is required" });
    }

    if (text.length > 280) {
      return res.status(400).json({ msg: "Post cannot exceed 280 characters" });
    }

    const postData = {
      text: text.trim(),
      user: req.user.id
    };

    // Add image if uploaded
    if (req.file) {
      postData.image = req.file.path;
    }

    const post = new Post(postData);
    await post.save();

    // Populate user info
    await post.populate("user", "username firstName lastName profilePicture");

    res.status(201).json({
      success: true,
      data: { post }
    });
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get all posts (paginated)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate("user", "username firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get posts error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username firstName lastName profilePicture")
      .populate("comments.user", "username firstName lastName profilePicture");

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json({
      success: true,
      data: { post }
    });
  } catch (err) {
    console.error("Get post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    if (text.length > 500) {
      return res.status(400).json({ msg: "Comment cannot exceed 500 characters" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = {
      user: req.user.id,
      text: text.trim()
    };

    post.comments.push(comment);
    await post.save();

    // Populate the new comment with user info
    await post.populate("comments.user", "username firstName lastName profilePicture");

    res.json({
      success: true,
      data: { post }
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get comments for a post
// @route   GET /api/posts/:id/comments
// @access  Public
exports.getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Get comments with pagination
    const comments = post.comments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    // Populate user info for comments
    await Post.populate(comments, {
      path: 'user',
      select: 'username firstName lastName profilePicture'
    });

    const total = post.comments.length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages,
          totalComments: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // Check if user owns the comment or the post
    if (comment.user.toString() !== req.user.id && post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to delete this comment" });
    }

    comment.deleteOne();
    await post.save();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized to delete this post" });
    }

    await post.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Public
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // First find the user to get their ObjectId
    const user = await User.findOne({ username: req.params.userId });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .populate("user", "username firstName lastName profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ user: user._id });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (err) {
    console.error("Get user posts error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Like a post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if already liked
    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.json({
      success: true,
      data: { post }
    });
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

// @desc    Unlike a post
// @route   DELETE /api/posts/:id/like
// @access  Private
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if not liked
    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({ msg: "Post not liked" });
    }

    post.likes = post.likes.filter(id => id.toString() !== req.user.id);
    await post.save();

    res.json({
      success: true,
      data: { post }
    });
  } catch (err) {
    console.error("Unlike post error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};





// Update handleLikePost to emit real-time updates
// exports.likePost = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const post = await Post.findById(id);
    
//     if (!post) {
//       return res.status(404).json({ msg: "Post not found" });
//     }

//     // Check if already liked
//     if (post.likes.includes(req.user.id)) {
//       return res.status(400).json({ msg: "Post already liked" });
//     }

//     post.likes.push(req.user.id);
//     await post.save();

//     // Emit real-time update
//     const io = req.app.get('io');
//     io.emit('postLiked', {
//       postId: id,
//       userId: req.user.id,
//       userName: req.user.firstName + ' ' + req.user.lastName,
//       likeCount: post.likes.length
//     });

//     res.json({
//       success: true,
//       data: { post }
//     });
//   } catch (err) {
//     console.error("Like post error:", err);
//     res.status(500).json({ msg: "Server error" });
//   }
// };

// Update addComment to emit real-time updates
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Comment text is required" });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ msg: "Post not found" });
    }

    const comment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(comment);
    await post.save();

    // Populate user info
    await post.populate('comments.user', 'username firstName lastName profilePicture');

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('newComment', {
      postId: id,
      comment: {
        ...comment,
        user: {
          _id: req.user.id,
          username: req.user.username,
          firstName: req.user.firstName,
          lastName: req.user.lastName
        }
      },
      commentCount: post.comments.length
    });

    res.json({
      success: true,
      data: { comment }
    });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};