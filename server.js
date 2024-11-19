const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const mongoDBUrl = "mongodb+srv://root:root@cluster0.pwr5n.mongodb.net/company?retryWrites=true&w=majority&appName=Cluster0";

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(mongoDBUrl)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(4000, () => {
      console.log("Server running on port 4000");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB", err);
  });

// Define User schema and model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// POST login route
app.post('/users', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      "your_jwt_secret", // Store this in an environment variable
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET all users route (for testing, optional)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();  // Retrieve all users from the database
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});
