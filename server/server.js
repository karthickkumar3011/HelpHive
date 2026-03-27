const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

// Root .env (repo) first so MONGO_URI/JWT match monorepo config; server/.env fills only unset keys.
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Allow local dev origins + deployed frontend origin from env.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  process.env.CLIENT_URL,
  process.env.CLIENT_URL_2,
].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl/postman) with no origin.
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json()); // ✅ parse JSON body
app.use(express.urlencoded({ extended: true })); // ✅ parse form-data if needed

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging (for debugging)
app.use((req, _res, next) => {
  console.log(`[${req.method}] ${req.url} - Body:`, req.body);
  next();
});

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"], credentials: true },
  transports: ["websocket", "polling"],
});
app.set("io", io);

// Export io for use in controllers
module.exports.io = io;

const authRoutes = require("./routes/authRoutes");
const helpRoutes = require("./routes/helpRoutes");
const postRoutes = require("./routes/postRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const hiveRoutes = require("./routes/hiveRoutes");

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("joinRoom", (userId) => {
    if (!userId) return;
    socket.join(String(userId));
    console.log(`👤 socket ${socket.id} joined room ${userId}`);
    // Emit online status
    socket.to(String(userId)).emit("userOnline", userId);
  });

  // socket.on("sendMessage", async (data) => {
  //   try {
  //     const newMessage = new Message({
  //       senderId: data.senderId,
  //       receiverId: data.receiverId,
  //       text: data.text,
  //     });
  //     const saved = await newMessage.save();

  //     io.to(String(saved.receiverId)).emit("receiveMessage", saved);
  //     io.to(String(saved.senderId)).emit("messageSent", saved);

  //     console.log(`💬 [socket] ${saved.senderId} -> ${saved.receiverId}`);
  //   } catch (err) {
  //     console.error("❌ socket save error:", err);
  //   }
  // });

  socket.on("typing", (data) => {
    socket.to(String(data.receiverId)).emit("userTyping", data.senderId);
  });

  socket.on("stopTyping", (data) => {
    socket.to(String(data.receiverId)).emit("userStopTyping", data.senderId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/help", helpRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/hives", hiveRoutes);

const connectDB = require("./config/connectDB");

connectDB()
  .then(() => {
    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch(() => process.exit(1));
