const express = require("express");
const {
  createPost,
  getFeedPosts,
  getPost,
  deletePost,
  getUserPosts
} = require("../controllers/postController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../utils/multer");

const router = express.Router();

router.route("/")
  .post(upload.single("image"), createPost)
  .get(getFeedPosts);

router.route("/:id")
  .get(getPost)
  .delete(deletePost);

router.get("/users/:userId/posts", getUserPosts);

module.exports = router;