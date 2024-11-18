const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Import bcryptjs
const jwt = require('jsonwebtoken'); // Import jsonwebtoken

const mongoDBUrl = "mongodb+srv://root:root@cluster0.pwr5n.mongodb.net/company?retryWrites=true&w=majority&appName=Cluster0";

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(mongoDBUrl).then(() => {
  console.log("Connected to MongoDB");
  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Error connecting to MongoDB:", error);
});

// Define User schema and model (role removed)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }, // Password will be hashed
});

const User = mongoose.model('User', UserSchema);

// LOGIN endpoint to authenticate user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Compare the entered password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token (role is excluded here)
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      "your_jwt_secret", // Use an environment variable for secret in production
      { expiresIn: "1h" }
    );

    // Send response with token
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Optionally, for user creation, you can hash the password before saving it
app.post('/users', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    // Hash password before saving to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Error creating user", error });
  }
});
