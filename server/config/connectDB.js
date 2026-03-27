const mongoose = require("mongoose");

/**
 * Node on Windows often resolves "localhost" to ::1 while MongoDB listens on IPv4 only.
 * Only applies to mongodb:// URIs (not mongodb+srv Atlas strings).
 */
function resolveMongoUri(uri) {
  if (!uri || !uri.startsWith("mongodb://")) return uri;
  return uri.replace(/(mongodb:\/\/(?:[^@]*@)?)localhost(?=[:/])/g, "$1127.0.0.1");
}

async function connectDB() {
  const raw = process.env.MONGO_URI?.trim();
  if (!raw) {
    console.error(
      "Missing MONGO_URI in server/.env. Examples:\n" +
        "  Local:  MONGO_URI=mongodb://127.0.0.1:27017/helphive\n" +
        "  Atlas:  MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<dbname>"
    );
    throw new Error("MONGO_URI not set");
  }

  const uri = resolveMongoUri(raw);
  if (uri !== raw) {
    console.log("Resolved localhost → 127.0.0.1 in MONGO_URI for this platform.");
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error(
      "If local: install/start MongoDB (port 27017) or run `mongod` / Docker.\n" +
        "If Atlas: confirm network access (IP allowlist) and user/password in the URI."
    );
    throw err;
  }
}

module.exports = connectDB;
