const express = require("express");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const cors = require("cors");
const User = require("./models/User");
const Message = require("./models/Message");
const http = require("http");
const socketIo = require("socket.io");

const app = express();

// Create an HTTP server and attach Socket.io to it
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Adjust this for security in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// Middleware setup
app.use(
  cors({
    origin: "*", // Update this for security in production
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);

// Socket.io Setup
const users = {}; // Track online users with their socket IDs

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Fetch and emit all users when a new user connects
  User.find({}, "fullName email lastLogin")
    .then((usersList) => {
      io.emit("userList", { online: Object.values(users), all: usersList });
    })
    .catch((err) => {
      console.error(err);
    });

  socket.on("setUser", (username) => {
    users[socket.id] = username;
    io.emit("userList", {
      online: Object.values(users),
      all: Object.values(users),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    delete users[socket.id];
    io.emit("userList", {
      online: Object.values(users),
      all: Object.values(users),
    });
  });

  socket.on("sendMessage", async ({ from, to, content, chatId }) => {
    console.log('Received sendMessage event:', { from, to, content, chatId });
    const message = new Message({ from, to, content, chatId });
    await message.save();
    
    // Get the socket ID of the recipient
    const recipientSocketId = Object.keys(users).find(
      (id) => users[id] === to
    );

    if (recipientSocketId) {
      io.to(recipientSocketId).emit("receiveMessage", { from, to, content, chatId });
    } else {
      console.log(`Recipient ${to} is not connected`);
    }
  });

  // Fetch messages between two users
  socket.on("fetchMessages", async ({ from, to, chatId }) => {
    console.log('Fetching messages between:', { from, to, chatId });
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }, { chatId }] },
        { $and: [{ from: to }, { to: from }, { chatId }] },
      ],
    }).sort({ timestamp: 1 });
    socket.emit("messageHistory", messages);
  });

  socket.on("loadInitialMessages", async ({ from, to, limit, chatId }) => {
    console.log('Loading initial messages:', { from, to, limit, chatId });
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }, { chatId }] },
        { $and: [{ from: to }, { to: from }, { chatId }] },
      ],
    }).sort({ timestamp: -1 }).limit(limit);
    console.log('Initial messages:', messages);
    socket.emit("initialMessages", messages.reverse()); // Reverse for proper order
  });

  socket.on("loadMoreMessages", async ({ from, to, lastMessageId, limit, chatId }) => {
    console.log('Loading more messages:', { from, to, lastMessageId, limit, chatId });
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }, { chatId }] },
        { $and: [{ from: to }, { to: from }, { chatId }] },
      ],
      _id: { $lt: lastMessageId }
    }).sort({ timestamp: -1 }).limit(limit);
    console.log('More messages:', messages);
    socket.emit("moreMessages", messages.reverse()); // Reverse for proper order
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
