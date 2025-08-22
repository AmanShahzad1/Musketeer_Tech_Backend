const Chat = require("../models/Chat");
const User = require("../models/User");

exports.getOrCreateChat = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user.id === userId) {
      return res.status(400).json({ msg: "Cannot chat with yourself" });
    }

    // Find existing chat
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, userId] }
    }).populate('participants', 'username firstName lastName profilePicture');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user.id, userId]
      });
      await chat.save();
      
      // Populate participants
      await chat.populate('participants', 'username firstName lastName profilePicture');
    }

    res.json({
      success: true,
      data: { chat }
    });
  } catch (err) {
    console.error("Get or create chat error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ msg: "Message text is required" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ msg: "Chat not found" });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized to send message in this chat" });
    }

    // Add message
    const message = {
      sender: req.user.id,
      text: text.trim(),
      timestamp: new Date(),
      read: false
    };

    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();

    // Populate the newly added message with sender info
    const populatedChat = await Chat.findById(chatId)
      .populate('messages.sender', 'username firstName lastName profilePicture')
      .populate('participants', 'username firstName lastName profilePicture');

    const newMessage = populatedChat.messages[populatedChat.messages.length - 1];

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      chat.participants.forEach(participantId => {
        if (participantId.toString() !== req.user.id) {
          io.to(`user_${participantId}`).emit('newMessage', {
            chatId: chatId,
            message: newMessage
          });
        }
      });
    }

    res.json({
      success: true,
      data: { message: newMessage }
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId)
      .populate('messages.sender', 'username firstName lastName profilePicture');
    
    if (!chat) {
      return res.status(404).json({ msg: "Chat not found" });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(401).json({ msg: "Not authorized to view this chat" });
    }

    // Paginate messages
    const skip = (page - 1) * limit;
    const messages = chat.messages
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: { 
        messages,
        hasMore: chat.messages.length > skip + parseInt(limit)
      }
    });
  } catch (err) {
    console.error("Get chat messages error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'username firstName lastName profilePicture')
    .populate('messages.sender', 'username firstName lastName profilePicture')
    .sort({ lastMessage: -1 });

    res.json({
      success: true,
      data: { chats }
    });
  } catch (err) {
    console.error("Get user chats error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};