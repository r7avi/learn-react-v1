// socket.js
const User = require("./models/User");
const Message = require("./models/Message");

const users = {}; // Track online users with their socket IDs

module.exports = (io) => {
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

    // Set the user when they connect
    socket.on("setUser", (userId) => {
      users[socket.id] = userId;
      io.emit("userList", {
        online: Object.values(users),
        all: Object.values(users),
      });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      delete users[socket.id];
      io.emit("userList", {
        online: Object.values(users),
        all: Object.values(users),
      });
    });

    // Handle sending messages
    socket.on("sendMessage", async ({ from, to, content }) => {
      console.log('Received sendMessage event:', { from, to, content });
      const message = new Message({ from, to, content });
      await message.save();
      
      // Get the socket ID of the recipient
      const recipientSocketId = Object.keys(users).find(
        (id) => users[id] === to
      );

      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receiveMessage", { from, to, content });
      } else {
        console.log(`Recipient ${to} is not connected`);
      }
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

    // Load initial messages
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

    // Load more messages
    socket.on("loadMoreMessages", async ({ from, to, lastMessageId, limit }) => {
      console.log('Loading more messages:', { from, to, lastMessageId, limit });
      const messages = await Message.find({
        $or: [
          { $and: [{ from }, { to }] },
          { $and: [{ from: to }, { to: from }] },
        ],
        _id: { $lt: lastMessageId }
      }).sort({ _id: -1 }).limit(limit);
      console.log('More messages:', messages);
      socket.emit("moreMessages", messages.reverse()); // Reverse for proper order
    });
  });
};
