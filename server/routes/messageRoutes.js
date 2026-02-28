const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { sendMessage, getMessages, markAsRead } = require("../controllers/messageController");

// Get messages between logged-in user and receiver
router.get("/:receiverId", authMiddleware, getMessages);

// Send a message
router.post("/", authMiddleware, sendMessage);

// Mark messages as read
router.put("/markAsRead", authMiddleware, markAsRead);

module.exports = router;
