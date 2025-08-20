const mongoose = require("mongoose");

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: [500, "Comment cannot exceed 500 characters"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PostSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, "Post text is required"],
    maxlength: [280, "Post cannot exceed 280 characters"],
    trim: true
  },
  image: {
    type: String,
    default: ""
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
PostSchema.index({ user: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Post", PostSchema);