// server/routes/postRoutes.js
const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

// -----------------------------
// CREATE NEW POST
// -----------------------------
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { title, description, location, category, image, video, tags } = req.body;

    const newPost = new Post({
      title,
      description,
      location,
      category,
      media: [],
      status: "Open",
      helpers: [],
      tags: tags || [],
      upvotes: 0,
      upvoters: [],
      comments: [],
      createdBy: req.user.id,
    });

    if (image) newPost.media.push(image);
    if (video) newPost.media.push(video);

    const savedPost = await newPost.save();
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
    const posts = await Post.find()
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
// GET NEARBY POSTS
// -----------------------------
router.get("/nearby", authenticateToken, async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query; // meters
    if (!lat || !lng) return res.status(400).json({ message: "Latitude and longitude required" });

    const posts = await Post.find({
      "location.coordinates": {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(maxDistance)
        }
      }
    })
      .populate('createdBy', 'username avatar')
      .populate('helpers', 'username avatar')
      .populate('comments.user', 'username avatar');

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching nearby posts:", error);
    res.status(500).json({ message: "Failed to fetch nearby posts", error: error.message });
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
    const { title, description, location, category, tags, media } = req.body;
    
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

    const newPost = new Post({
      title,
      description,
      location: locationData,
      category,
      media: media || [],
      status: "Open",
      helpers: [],
      tags: tags && typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
      upvotes: 0,
      upvoters: [],
      comments: [],
      createdBy: req.user.id,
    });

    const savedPost = await newPost.save();
    await savedPost.populate('createdBy', 'username avatar');

    res.status(201).json(savedPost);
  } catch (error) {
    console.error("Error creating post with files:", error);
    res.status(500).json({ message: "Failed to create post", error: error.message });
  }
});

module.exports = router;
