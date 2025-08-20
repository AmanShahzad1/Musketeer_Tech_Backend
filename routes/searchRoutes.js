const express = require("express");
const { 
  searchUsers, 
  searchPosts, 
  globalSearch 
} = require("../controllers/searchController");

const router = express.Router();

// Search routes
router.get("/users", searchUsers);
router.get("/posts", searchPosts);
router.get("/", globalSearch);

module.exports = router;