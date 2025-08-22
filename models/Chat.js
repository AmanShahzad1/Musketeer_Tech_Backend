const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const ChatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }],
  messages: [MessageSchema],
  lastMessage: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure participants are unique
ChatSchema.index({ participants: 1 });

// Virtual for unread message count
ChatSchema.virtual('unreadCount').get(function() {
  if (!this.messages) return 0;
  return this.messages.filter(msg => !msg.read && msg.sender.toString() !== this.participants[0].toString()).length;
});

// Ensure virtuals are serialized
ChatSchema.set('toJSON', { virtuals: true });
ChatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Chat", ChatSchema);