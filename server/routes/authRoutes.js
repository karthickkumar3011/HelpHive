// server/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User"); // make sure this is CommonJS export

// Middleware to protect routes
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // store user id in req.user
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// REGISTER
router.post("/register", async (req, res) => {
  const {
    name,
    username,
    email,
    password,
    avatar,
    bio,
    location,
    skills,
    profession,
  } = req.body;

  try {
    // Check existing email & username
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Ensure location is valid GeoJSON Point
    const locationData = location && location.coordinates
      ? {
          type: "Point",
          coordinates: [
            parseFloat(location.coordinates[0]) || 0,
            parseFloat(location.coordinates[1]) || 0,
          ],
          address: location.address || "",
        }
      : {
          type: "Point",
          coordinates: [0, 0],
          address: "",
        };

    // Save user
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      avatar: avatar || "",
      bio: bio || "",
      location: locationData,
      skills: Array.isArray(skills)
        ? skills
        : skills
        ? skills.split(",").map((s) => s.trim())
        : [],
      profession: profession || "",
    });

    await newUser.save();

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Respond with token + user
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        location: newUser.location,
        skills: newUser.skills,
        profession: newUser.profession,
        helpingPosts: newUser.helpingPosts || [],
        createdAt: newUser.createdAt,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // 'identifier' can be email or username

  try {
    // Find user by email OR username
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        skills: user.skills,
        profession: user.profession,
        helpingPosts: user.helpingPosts || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET LOGGED-IN USER
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
