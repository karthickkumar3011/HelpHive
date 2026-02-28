import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      bio,
      location,
      skills,
      profession,
    } = req.body;

    // check required fields
    if (!name || !username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or Username already exists" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      avatar: req.body.avatar || undefined, // default will apply from schema
      bio,
      location,
      skills: skills ? skills.split(",").map((s) => s.trim()) : [],
      profession,
      joinedDate: new Date(),
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
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
        joinedDate: newUser.joinedDate,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    // ✅ Custom error handling
    if (error.code === 11000) {
      // duplicate key
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(400)
        .json({ message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists` });
    }

    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }

    res.status(500).json({ message: "Server error during registration" });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
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
        joinedDate: user.joinedDate,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
