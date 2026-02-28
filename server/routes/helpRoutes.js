const express = require("express");
const router = express.Router();
const Help = require("../models/Help");
const authenticateToken = require("../middleware/authMiddleware");

// POST /api/help/create
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { title, description, image, video, location, category } = req.body;

    const newHelp = new Help({
      title,
      description,
      image,
      video,
      location,
      category,
      createdBy: req.user.id,
    });

    const savedHelp = await newHelp.save();
    res.status(201).json(savedHelp);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
