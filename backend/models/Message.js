// backend/models/Message.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Message schema
const messageSchema = new Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create the Message model
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
