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

router.get("/:userId", getOrCreateChat);
router.post("/:chatId/message", sendMessage);
router.get("/:chatId/messages", getChatMessages);
router.get("/", getUserChats);

module.exports = router;