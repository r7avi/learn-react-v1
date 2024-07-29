// backend/index.js

const express = require('express');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const cors = require('cors');
const User = require('./models/User');
const Message = require('./models/Message'); // Import the Message model
const http = require('http');
const socketIo = require('socket.io');

const app = express();

// Create an HTTP server and attach Socket.io to it
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Adjust this for security in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
});

// Middleware setup
app.use(cors({
  origin: '*', // Update this for security in production
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
}));

// Connect to MongoDB
connectDB();

// Middleware to parse JSON
app.use(express.json());

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/notes', noteRoutes);

// Socket.io Setup
const users = {}; // Track online users

io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // Fetch and emit all users when a new user connects
  User.find({}, 'fullName email').then(usersList => {
    io.emit('userList', { online: Object.values(users), all: usersList });
  }).catch(err => {
    console.error(err);
  });

  socket.on('setUser', (username) => {
    users[socket.id] = username;
    io.emit('userList', { online: Object.values(users), all: Object.values(users) });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete users[socket.id];
    io.emit('userList', { online: Object.values(users), all: Object.values(users) });
  });

  socket.on('sendMessage', async ({ from, to, content }) => {
    const message = new Message({ from, to, content });
    await message.save();
    io.emit('receiveMessage', { from, to, content });
  });

  socket.on('fetchMessages', async ({ from, to }) => {
    const messages = await Message.find({
      $or: [
        { $and: [{ from }, { to }] },
        { $and: [{ from: to }, { to: from }] }
      ]
    }).sort({ timestamp: 1 });
    socket.emit('messageHistory', messages);
  });

});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
