// server/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Hive = require("../models/Hive");
const authenticateToken = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');
const mongoose = require("mongoose");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// -----------------------------
// GET POSTS BY USER (author = createdBy in schema)
// -----------------------------
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const posts = await Post.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username avatar")
      .populate("helpers", "username avatar")
      .populate("comments.user", "username avatar");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching user posts", error: error.message });
  }
});

// -----------------------------
// GET NEARBY POSTS (before generic GET /)
// -----------------------------
router.get("/nearby", authenticateToken, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: "Latitude and longitude required" });

    const posts = await Post.find({
      "location.coordinates": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance, 10),
        },
      },
    })
      .populate("createdBy", "username avatar")
      .populate("helpers", "username avatar")
      .populate("comments.user", "username avatar");

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching nearby posts:", error);
    res.status(500).json({ message: "Failed to fetch nearby posts", error: error.message });
  }
});

// -----------------------------
// CREATE NEW POST
// -----------------------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, location, category, image, video, tags, hiveIds } = req.body;

    const normalizedTags = Array.isArray(tags)
      ? tags
      : tags && typeof tags === "string"
        ? tags.split(",")
        : [];

    const cleanTags = normalizedTags
      .map((t) =>
        t === null || t === undefined ? "" : String(t).trim().toLowerCase()
      )
      .filter(Boolean);

    const requestedHiveIds = Array.isArray(hiveIds) ? hiveIds : [];
    const validRequestedHiveIds = requestedHiveIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    let resolvedHiveIds = validRequestedHiveIds;
    if (resolvedHiveIds.length === 0 && cleanTags.length > 0) {
      const userId = req.user.id;
      const hiveDocs = await Promise.all(
        cleanTags.map(async (tagName) =>
          Hive.findOneAndUpdate(
            { name: tagName },
            {
              $setOnInsert: {
                name: tagName,
                description: "",
                createdBy: userId,
                members: [userId],
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );
      resolvedHiveIds = hiveDocs.map((h) => h._id);
    }

    const newPost = new Post({
      title,
      description,
      location,
      category,
      media: [],
      status: "Open",
      helpers: [],
      tags: cleanTags,
      hives: resolvedHiveIds,
      upvotes: 0,
      upvoters: [],
      comments: [],
      createdBy: req.user.id,
    });

    if (image) newPost.media.push(image);
    if (video) newPost.media.push(video);

    const savedPost = await newPost.save();

    // Notify hive members for this post (if it belongs to any hives).
    if (Array.isArray(resolvedHiveIds) && resolvedHiveIds.length > 0) {
      const { createNotification } = require("../controllers/notificationController");

      const hiveDocs = await Hive.find({ _id: { $in: resolvedHiveIds } })
        .select("name members createdBy");

      const authorIdStr = String(req.user.id);
      const senderName = req.user?.username || req.user?.name || "Someone";

      await Promise.all(
        hiveDocs.map((hive) => {
          const recipientIds = (hive.members || []).filter(
            (memberId) => String(memberId) !== authorIdStr
          );

          return Promise.all(
            recipientIds.map((recipientId) =>
              createNotification(
                recipientId,
                req.user.id,
                "hive_post",
                "New Hive Post",
                `${senderName} posted in ${hive.name}: "${savedPost.title}"`,
                savedPost._id,
                null,
                hive._id
              )
            )
          );
        })
      );
    }

    await savedPost.populate('createdBy', 'username avatar');

    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
});

// -----------------------------
// GET ALL POSTS
// -----------------------------
router.get("/", async (req, res) => {
  try {
    const { tag } = req.query;
    const filter = {};

    if (tag && String(tag).trim()) {
      const normalizedTag = String(tag).trim().toLowerCase();
      filter.tags = new RegExp(`^${escapeRegex(normalizedTag)}$`, "i");
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username avatar')
      .populate('helpers', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error while fetching posts", error: error.message });
  }
});

// -----------------------------
// HELP ON POST
// -----------------------------
router.put("/:id/help", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if already helping
    if (post.helpers.includes(req.user.id)) {
      await post.populate('helpers', 'username avatar');
      return res.status(200).json({ message: "You are already helping this post", post });
    }

    // Add user to post helpers
    post.helpers.push(req.user.id);
    if (post.status === "Open") post.status = "In Progress";
    await post.save();

    // Update user helpingPosts
    const user = await User.findById(req.user.id);
    if (!user.helpingPosts) user.helpingPosts = [];
    if (!user.helpingPosts.includes(post._id)) {
      user.helpingPosts.push(post._id);
      await user.save();
    }

    // Create notification for post owner (if not helping on own post)
    if (post.createdBy.toString() !== req.user.id.toString()) {
      const { createNotification } = require('../controllers/notificationController');
      await createNotification(
        post.createdBy,
        req.user.id,
        'help_request',
        'New Helper',
        `${req.user.username || 'Someone'} offered to help with your post: "${post.title}"`,
        post._id
      );
    }

    const populatedPost = await Post.findById(req.params.id)
      .populate('createdBy', 'username avatar')
      .populate('helpers', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(200).json({ message: "You are now helping this post", post: populatedPost });
  } catch (error) {
    console.error("Error adding helper:", error);
    res.status(500).json({ message: "Failed to help on post", error: error.message });
  }
});

// -----------------------------
// ADD COMMENT
// -----------------------------
router.post("/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") return res.status(400).json({ message: "Comment cannot be empty" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user.id, text, createdAt: new Date() });
    await post.save();
    await post.populate('comments.user', 'username avatar');

    // Create notification for post owner (if not commenting on own post)
    if (post.createdBy.toString() !== req.user.id.toString()) {
      const { createNotification } = require('../controllers/notificationController');
      await createNotification(
        post.createdBy,
        req.user.id,
        'comment',
        'New Comment',
        `${req.user.username || 'Someone'} commented on your post: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        post._id
      );
    }

    res.status(201).json({ message: "Comment added", post });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
});

// -----------------------------
// UPVOTE POST
// -----------------------------
router.put("/:id/upvote", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.upvoters.includes(req.user.id)) {
      return res.status(400).json({ message: "You have already upvoted this post" });
    }

    post.upvotes += 1;
    post.upvoters.push(req.user.id);

    await post.save();

    // Create notification for post owner (if not upvoting own post)
    if (post.createdBy.toString() !== req.user.id.toString()) {
      const { createNotification } = require('../controllers/notificationController');
      await createNotification(
        post.createdBy,
        req.user.id,
        'like',
        'New Upvote',
        `${req.user.username || 'Someone'} upvoted your post: "${post.title}"`,
        post._id
      );
    }

    res.status(200).json({ message: "Post upvoted", post });
  } catch (error) {
    console.error("Error upvoting post:", error);
    res.status(500).json({ message: "Failed to upvote post", error: error.message });
  }
});

// -----------------------------
// UPDATE STATUS (author only)
// -----------------------------
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const allowed = ["Open", "In Progress", "Ongoing", "Closed"];
    const { status } = req.body;
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(", ")}` });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author can update this post" });
    }

    post.status = status;
    await post.save();
    await post.populate("createdBy", "username avatar");
    await post.populate("helpers", "username avatar");
    await post.populate("comments.user", "username avatar");

    res.json({ message: "Status updated", post });
  } catch (error) {
    console.error("Error updating post status:", error);
    res.status(500).json({ message: "Failed to update status", error: error.message });
  }
});

// -----------------------------
// DELETE POST (author only)
// -----------------------------
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author can delete this post" });
    }

    await Post.findByIdAndDelete(req.params.id);
    await User.updateMany(
      { helpingPosts: req.params.id },
      { $pull: { helpingPosts: req.params.id } }
    );

    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Failed to delete post", error: error.message });
  }
});

// -----------------------------
// UPLOAD FILES
// -----------------------------
router.post("/upload", authenticateToken, uploadMultiple('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Generate file URLs
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);

    res.status(200).json({
      message: "Files uploaded successfully",
      files: fileUrls,
      count: req.files.length
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({ message: "Failed to upload files", error: error.message });
  }
});

// -----------------------------
// CREATE POST WITH FILE UPLOADS
// -----------------------------
router.post("/create-with-files", authenticateToken, async (req, res) => {
  try {
    const { title, description, location, category, tags, media, hiveIds } = req.body;
    
    // Parse location if it's a string
    let locationData;
    try {
      locationData = typeof location === 'string' ? JSON.parse(location) : location;
    } catch (e) {
      locationData = {
        type: "Point",
        coordinates: [0, 0],
        address: location || ""
      };
    }

    const normalizedTags =
      tags && typeof tags === "string"
        ? tags.split(",").map((t) => t.trim())
        : Array.isArray(tags)
          ? tags
          : [];

    const cleanTags = normalizedTags
      .map((t) =>
        t === null || t === undefined ? "" : String(t).trim().toLowerCase()
      )
      .filter(Boolean);

    const requestedHiveIds = Array.isArray(hiveIds) ? hiveIds : [];
    const validRequestedHiveIds = requestedHiveIds.filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    let resolvedHiveIds = validRequestedHiveIds;
    if (resolvedHiveIds.length === 0 && cleanTags.length > 0) {
      const userId = req.user.id;
      const hiveDocs = await Promise.all(
        cleanTags.map(async (tagName) =>
          Hive.findOneAndUpdate(
            { name: tagName },
            {
              $setOnInsert: {
                name: tagName,
                description: "",
                createdBy: userId,
                members: [userId],
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
        )
      );
      resolvedHiveIds = hiveDocs.map((h) => h._id);
    }

    const newPost = new Post({
      title,
      description,
      location: locationData,
      category,
      media: media || [],
      status: "Open",
      helpers: [],
      tags: cleanTags,
      hives: resolvedHiveIds,
      upvotes: 0,
      upvoters: [],
      comments: [],
      createdBy: req.user.id,
    });

    const savedPost = await newPost.save();

    // Notify hive members for this post (if it belongs to any hives).
    if (Array.isArray(resolvedHiveIds) && resolvedHiveIds.length > 0) {
      const { createNotification } = require("../controllers/notificationController");

      const hiveDocs = await Hive.find({ _id: { $in: resolvedHiveIds } })
        .select("name members createdBy");

      const authorIdStr = String(req.user.id);
      const senderName = req.user?.username || req.user?.name || "Someone";

      await Promise.all(
        hiveDocs.map((hive) => {
          const recipientIds = (hive.members || []).filter(
            (memberId) => String(memberId) !== authorIdStr
          );

          return Promise.all(
            recipientIds.map((recipientId) =>
              createNotification(
                recipientId,
                req.user.id,
                "hive_post",
                "New Hive Post",
                `${senderName} posted in ${hive.name}: "${savedPost.title}"`,
                savedPost._id,
                null,
                hive._id
              )
            )
          );
        })
      );
    }

    await savedPost.populate('createdBy', 'username avatar');

    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post with files:", error);
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
});

module.exports = router;
