const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');  // Import JWT package
const bcrypt = require('bcryptjs');  // Import bcrypt for password hashing

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

// Define User schema and model
const UserSchema = new mongoose.Schema({
  username: String,
  role: String,
  password: String,  // Store hashed password, not plain text
});

const User = mongoose.model('User', UserSchema);

// API endpoint to create a new user (for registration purposes)
app.post('/users', async (req, res) => {
  try {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
      role: req.body.role,
    });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
});

// Login endpoint to authenticate user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // If password matches, create a JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      'your_jwt_secret_key',  // Secret key for signing the token
      { expiresIn: '1h' }  // Token expiration time
    );

    // Return the token to the client
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});

// Your other endpoints (like /employees) remain the same...
