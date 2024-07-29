const express = require('express');
const Note = require('../models/Note');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to protect routes
router.use(authMiddleware);

// Create a new note
router.post('/', async (req, res) => {
  const { title, description, tag } = req.body;

  try {
    const note = new Note({
      title,
      description,
      tag,
    });
    await note.save();
    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all notes for the logged-in user
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find();
    res.status(200).json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fetch all users
router.get('/all', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
