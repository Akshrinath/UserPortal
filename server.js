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

// Define User schema and model with a role field
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['admin', 'manager', 'employee'], default: 'employee' }, // Added more roles
});

const User = mongoose.model('User', UserSchema);

// POST login route
app.post('/login', async (req, res) => {
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
      { userId: user._id, username: user.username, role: user.role }, // Including role in token
      "your_jwt_secret", 
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token, role: user.role }); // Send role in response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Middleware to check user role
const verifyRole = (roles) => {
  return (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
      return res.status(403).json({ message: "No token provided" });
    }

    jwt.verify(token, "your_jwt_secret", (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: "Failed to authenticate token" });
      }

      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Access denied: Insufficient permissions" });
      }

      req.user = decoded;
      next();
    });
  };
};

// Example of role-specific routes
app.get('/admin', verifyRole(['admin']), (req, res) => {
  res.json({ message: "Welcome Admin!" });
});

app.get('/manager', verifyRole(['manager', 'admin']), (req, res) => {
  res.json({ message: "Welcome Manager!" });
});

app.get('/employee', verifyRole(['employee', 'manager', 'admin']), (req, res) => {
  res.json({ message: "Welcome Employee!" });
});

// GET all users route (for testing, optional)
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
});
