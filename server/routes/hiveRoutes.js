const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const {
  listHives,
  listTrendingHives,
  getMyHives,
  getHiveDetail,
  createHive,
  joinHive,
  leaveHive,
  getHivePosts,
} = require("../controllers/hiveController");

// Public list
router.get("/", listHives);

// Trending (before /:hiveId)
router.get("/trending", listTrendingHives);

// My hives (auth)
router.get("/my", authenticateToken, getMyHives);

// Create hive (auth)
router.post("/", authenticateToken, createHive);

// Hive details (public)
router.get("/:hiveId", getHiveDetail);

// Join/leave (auth)
router.post("/:hiveId/join", authenticateToken, joinHive);
router.post("/:hiveId/leave", authenticateToken, leaveHive);

// Hive posts feed (public)
router.get("/:hiveId/posts", getHivePosts);

module.exports = router;

