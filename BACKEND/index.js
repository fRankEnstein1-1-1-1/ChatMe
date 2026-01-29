require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(express.json());

// ✅ Allow multiple origins for hosting + local
const allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for this origin"), false);
    },
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const server = http.createServer(app);

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// ✅ Connect to MongoDB (Atlas / Local using env)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected!"))
  .catch((err) => console.log("❌ MongoDB connection error:", err.message));

// ✅ Schemas
const MessageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    message: { type: String, required: true },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // ⚠️ plain text (your choice)
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

// ✅ Socket logic
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join", ({ senderId, receiverId }) => {
    if (!senderId || !receiverId) return;

    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);

    console.log(`✅ User joined room: ${roomId}`);
  });

  socket.on("sendMessage", async ({ senderId, receiverId, message }) => {
    if (!senderId || !receiverId || !message) return;

    const roomId = [senderId, receiverId].sort().join("_");

    try {
      const newMessage = await Message.create({ senderId, receiverId, message });

      io.to(roomId).emit("receiveMessage", {
        _id: newMessage._id,
        senderId,
        receiverId,
        message,
        seen: newMessage.seen,
        createdAt: newMessage.createdAt,
      });
    } catch (err) {
      console.log("❌ Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// ✅ Health check
app.get("/", (req, res) => {
  res.json({ message: "✅ ChatMe backend is running" });
});

// ✅ SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exists = await User.findOne({ username });
    if (exists) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const user = await User.create({ name, username, password });

    res.json({ message: "User Registered Successfully!", user: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ LOGIN
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.password !== password) {
      return res.status(401).json({ message: "INCORRECT PASSWORD" });
    }

    res.json({ message: "Login Successful", username: user.username });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ SEARCH USER BY USERNAME
app.get("/search", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ message: "Need username to search" });
    }

    const user = await User.findOne({ username }).select("username name");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error occurred", error: error.message });
  }
});

// ✅ RANDOM USER (optimized)
app.get("/randomsearch", async (req, res) => {
  try {
    const excludeUser = req.query.exclude;

    const randomUser = await User.aggregate([
      { $match: { username: { $ne: excludeUser } } },
      { $sample: { size: 1 } },
      { $project: { username: 1, name: 1 } },
    ]);

    if (!randomUser.length) {
      return res.status(404).json({ message: "No other users available" });
    }

    res.json(randomUser[0]);
  } catch (err) {
    res.status(500).json({
      message: "Error occurred while random search",
      error: err.message,
    });
  }
});

// ✅ UNSEEN SENDERS
app.get("/unseen", async (req, res) => {
  try {
    const { receiverId } = req.query;

    if (!receiverId) {
      return res.status(400).json({ message: "receiverId is required" });
    }

    // group unseen messages by senderId
    const unseenGrouped = await Message.aggregate([
      { $match: { receiverId, seen: false } },
      { $group: { _id: "$senderId", count: { $sum: 1 } } },
    ]);

    const senderIds = unseenGrouped.map((x) => x._id);

    const users = await User.find({ username: { $in: senderIds } }).select("username");

    // merge count into users
    const senders = users.map((u) => {
      const found = unseenGrouped.find((x) => x._id === u.username);
      return {
        username: u.username,
        count: found?.count || 0,
      };
    });

    const totalUnseen = unseenGrouped.reduce((sum, x) => sum + x.count, 0);

    res.json({ totalUnseen, senders });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ✅ GET MESSAGES
app.get("/messages", async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Both sender and receiver required" });
    }

    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ MARK SEEN
app.post("/markseen", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "Both sender and receiver required" });
    }

    await Message.updateMany(
      { senderId, receiverId, seen: false },
      { $set: { seen: true } }
    );

    res.json({ message: "Messages marked as seen." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Start server (Hosting friendly)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
