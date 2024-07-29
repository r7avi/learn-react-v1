const express = require("express");
const connectDB = require("./config/db");

const app = express();
// Connect to MongoDB
connectDB();

// Define a route for testing
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start server and listen on port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
