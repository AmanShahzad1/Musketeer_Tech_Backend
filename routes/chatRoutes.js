const express = require("express");
const { 
  getOrCreateChat,
  sendMessage,
  getChatMessages,
  getUserChats
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all user chats
router.get("/", getUserChats);

// Get or create chat with specific user
router.get("/user/:userId", getOrCreateChat);

// Send message to specific chat
router.post("/:chatId/message", sendMessage);

// Get messages from specific chat
router.get("/:chatId/messages", getChatMessages);

module.exports = router;