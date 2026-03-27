// server/routes/userRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/User");

// 🔍 Search users by username or name
router.get("/search", async (req, res) => {
  const q = req.query.q || "";
  try {
    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } }
      ]
    }).select("_id username name email location skills");
    res.json(users);
  } catch (e) {
    console.error("Search error:", e);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// 👤 GET /api/users/:id -> return single user info
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  // Validate MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await User.findById(id)
      .select(
        "_id username name email bio avatar profession location skills createdAt helpingPosts"
      )
      .populate({
        path: "helpingPosts",
        select: "title description createdAt status",
      });
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (e) {
    console.error("Fetch user error:", e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// 📋 GET /api/users -> return all users (public info)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select(
      "_id username name email location skills createdAt"
    );
    res.json(users);
  } catch (e) {
    console.error("Fetch all users error:", e);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
