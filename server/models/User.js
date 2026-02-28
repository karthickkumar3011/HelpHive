// server/models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    profession: { type: String, default: "" },
    skills: { type: [String], default: [] },

    // GeoJSON location
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
      address: { type: String, default: "" },
    },

    // Optional references
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],

    // NEW: Posts the user is currently helping
    helpingPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  },
  { timestamps: true }
);

// Create geospatial index for nearby queries
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", UserSchema);
