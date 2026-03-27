const mongoose = require("mongoose");
const Hive = require("../models/Hive");
const Post = require("../models/Post");
const { createNotification } = require("./notificationController");

const getUserId = (req) => req.user?.id || req.user?._id;

// GET /api/hives?search=
const listHives = async (req, res) => {
  try {
    const { search = "" } = req.query;
    const query = search
      ? { name: { $regex: search.trim(), $options: "i" } }
      : {};

    const hives = await Hive.find(query)
      .select("name description members createdBy")
      .sort({ createdAt: -1 })
      .limit(100);

    const mapped = hives.map((h) => ({
      _id: h._id,
      name: h.name,
      description: h.description,
      memberCount: (h.members || []).length,
      createdBy: h.createdBy,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("listHives error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hives/my
const getMyHives = async (req, res) => {
  try {
    const userId = getUserId(req);
    const hives = await Hive.find({ members: userId })
      .select("name description members createdBy")
      .sort({ createdAt: -1 })
      .limit(200);

    const mapped = hives.map((h) => ({
      _id: h._id,
      name: h.name,
      description: h.description,
      memberCount: (h.members || []).length,
      createdBy: h.createdBy,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("getMyHives error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hives/:hiveId
const getHiveDetail = async (req, res) => {
  try {
    const { hiveId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hiveId)) {
      return res.status(400).json({ message: "Invalid hive id" });
    }

    const hive = await Hive.findById(hiveId).select(
      "name description members createdBy"
    );
    if (!hive) return res.status(404).json({ message: "Hive not found" });

    res.json({
      _id: hive._id,
      name: hive.name,
      description: hive.description,
      memberCount: (hive.members || []).length,
      createdBy: hive.createdBy,
    });
  } catch (err) {
    console.error("getHiveDetail error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/hives
const createHive = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, description = "" } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Hive name is required" });
    }

    const normalizedName = String(name).trim().toLowerCase();

    const hive = await Hive.findOneAndUpdate(
      { name: normalizedName },
      {
        $setOnInsert: {
          name: normalizedName,
          description: String(description || ""),
          createdBy: userId,
          members: [userId],
        },
      },
      { upsert: true, new: true }
    );

    // Ensure creator is a member (idempotent)
    await Hive.findByIdAndUpdate(
      hive._id,
      { $addToSet: { members: userId } },
      { new: true }
    );

    const updated = await Hive.findById(hive._id).select(
      "name description members createdBy"
    );

    res.status(201).json({
      _id: updated._id,
      name: updated.name,
      description: updated.description,
      memberCount: (updated.members || []).length,
      createdBy: updated.createdBy,
    });
  } catch (err) {
    console.error("createHive error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/hives/:hiveId/join
const joinHive = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { hiveId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hiveId)) {
      return res.status(400).json({ message: "Invalid hive id" });
    }

    const hiveBefore = await Hive.findById(hiveId).select("name createdBy members");
    if (!hiveBefore) return res.status(404).json({ message: "Hive not found" });

    const alreadyMember = (hiveBefore.members || []).some(
      (m) => String(m) === String(userId)
    );

    const updated = await Hive.findByIdAndUpdate(
      hiveId,
      { $addToSet: { members: userId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Hive not found" });

    if (!alreadyMember) {
      const senderName = req.user?.username || req.user?.name || "Someone";
      await createNotification(
        hiveBefore.createdBy,
        userId,
        "hive_join",
        "New Hive Member",
        `${senderName} joined your hive: "${hiveBefore.name}"`,
        null,
        null,
        hiveBefore._id
      );
    }

    res.json({ message: "Hive joined" });
  } catch (err) {
    console.error("joinHive error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/hives/:hiveId/leave
const leaveHive = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { hiveId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hiveId)) {
      return res.status(400).json({ message: "Invalid hive id" });
    }

    const updated = await Hive.findByIdAndUpdate(
      hiveId,
      { $pull: { members: userId } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Hive not found" });

    res.json({ message: "Hive left" });
  } catch (err) {
    console.error("leaveHive error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hives/:hiveId/posts
// Feed is public; it uses both `post.hives` and fallback matching by post.tags.
const getHivePosts = async (req, res) => {
  try {
    const { hiveId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hiveId)) {
      return res.status(400).json({ message: "Invalid hive id" });
    }

    const hive = await Hive.findById(hiveId).select("name");
    if (!hive) return res.status(404).json({ message: "Hive not found" });

    const posts = await Post.find({
      $or: [
        { hives: hiveId },
        // Fallback for older posts that don't yet have `post.hives` populated.
        // Use case-insensitive match since tag casing may differ.
        { tags: { $regex: hive.name, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("createdBy", "username avatar")
      .populate("helpers", "username avatar")
      .populate("comments.user", "username avatar");

    res.json(posts);
  } catch (err) {
    console.error("getHivePosts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/hives/trending — by members + posts in hive (must stay above /:hiveId route)
const listTrendingHives = async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const rows = await Hive.aggregate([
      {
        $lookup: {
          from: "posts",
          localField: "_id",
          foreignField: "hives",
          as: "_postDocs",
        },
      },
      {
        $addFields: {
          memberCount: { $size: { $ifNull: ["$members", []] } },
          postCount: { $size: "$_postDocs" },
        },
      },
      {
        $addFields: {
          trendingScore: {
            $add: ["$memberCount", { $multiply: ["$postCount", 2] }],
          },
        },
      },
      { $sort: { trendingScore: -1, memberCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          memberCount: 1,
          postCount: 1,
          createdBy: 1,
        },
      },
    ]);

    res.json(rows);
  } catch (err) {
    console.error("listTrendingHives error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  listHives,
  listTrendingHives,
  getMyHives,
  getHiveDetail,
  createHive,
  joinHive,
  leaveHive,
  getHivePosts,
};

