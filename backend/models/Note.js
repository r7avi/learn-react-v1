const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the Note schema
const noteSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    default: 'General',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Create the Note model
const Note = mongoose.model('Note', noteSchema);

module.exports = Note;
