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
const users = {}; // Track online users

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

  socket.on("sendMessage", async ({ from, to, content }) => {
    console.log('Received sendMessage event:', { from, to, content });
    const message = new Message({ from, to, content });
    await message.save();
    io.emit("receiveMessage", { from, to, content });
  });

  // Fetch messages between two users
  socket.on("fetchMessages", async ({ from, to }) => {
    console.log('Fetching messages between:', { from, to });
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }] },
        { $and: [{ from: to }, { to: from }] },
      ],
    }).sort({ timestamp: 1 });
    socket.emit("messageHistory", messages);
  });

  socket.on("loadInitialMessages", async ({ from, to, limit }) => {
    console.log('Loading initial messages:', { from, to, limit });
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }] },
        { $and: [{ from: to }, { to: from }] },
      ],
    }).sort({ timestamp: -1 }).limit(limit);
    console.log('Initial messages:', messages);
    socket.emit("initialMessages", messages.reverse()); // Reverse for proper order
  });

  socket.on("loadMoreMessages", async ({ from, to, lastMessageId, limit }) => {
    console.log('Loading more messages:', { from, to, lastMessageId, limit });
    const moreMessages = await Message.find({
      $or: [
        { $and: [{ from }, { to }] },
        { $and: [{ from: to }, { to: from }] },
      ],
      _id: { $lt: lastMessageId } // Fetch messages before the lastMessageId
    }).sort({ timestamp: -1 }).limit(limit);
    console.log('More messages:', moreMessages);
    socket.emit("moreMessages", moreMessages.reverse()); // Reverse for proper order
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
