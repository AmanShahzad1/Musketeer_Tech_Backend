const express = require("express");
const { 
  createPost, 
  getPosts, 
  getPost, 
  deletePost, 
  getUserPosts,
  likePost,
  unlikePost,
  addComment,
  getComments,
  deleteComment
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

// Public routes
router.get("/", getPosts);
router.get("/:id", getPost);
router.get("/user/:userId", getUserPosts);
router.get("/:id/comments", getComments);

// Protected routes
router.post("/", protect, upload.single("image"), createPost);
router.delete("/:id", protect, deletePost);
router.post("/:id/like", protect, likePost);
router.delete("/:id/like", protect, unlikePost);
router.post("/:id/comments", protect, addComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);

module.exports = router;