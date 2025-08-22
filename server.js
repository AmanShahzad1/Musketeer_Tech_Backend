require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require("./config/db");



const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const postRoutes = require("./routes/postRoutes");
const searchRoutes = require("./routes/searchRoutes");
const friendsRoutes = require("./routes/friendsRoutes");
const followRoutes = require("./routes/followRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    socket.userId = userId;
  });

  // Handle typing events
  socket.on('typing', (data) => {
    // Broadcast typing event to all participants in the chat except the sender
    socket.to(`chat_${data.chatId}`).emit('userTyping', {
      chatId: data.chatId,
      userId: data.userId,
      username: data.username
    });
  });

  socket.on('stopTyping', (data) => {
    // Broadcast stop typing event to all participants in the chat except the sender
    socket.to(`chat_${data.chatId}`).emit('userStoppedTyping', {
      chatId: data.chatId,
      userId: data.userId,
      username: data.username
    });
  });

  // Join chat room when user starts chatting
  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  // Handle post like events
  socket.on('postLiked', (data) => {
    // Broadcast like event to all users except sender
    socket.broadcast.emit('postLiked', {
      postId: data.postId,
      userId: data.userId
    });
  });

  socket.on('postUnliked', (data) => {
    // Broadcast unlike event to all users except sender
    socket.broadcast.emit('postUnliked', {
      postId: data.postId,
      userId: data.userId
    });
  });

  // Handle comment events
  socket.on('commentAdded', (data) => {
    // Broadcast comment event to all users except sender
    socket.broadcast.emit('newComment', {
      postId: data.postId,
      comment: data.comment
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Clean up user data if needed
  });
});

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/chat", chatRoutes);

const PORT = process.env.PORT || 5000;

// Use server.listen instead of app.listen
server.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 