const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("Socket server is running");
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    // origin: "*", // Change this to your frontend URL in production
    origin:"https://metlyconncet.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Authentication middleware
io.use(require("./socket/auth"));

// Chat logic
require("./socket/chat")(io);

// Start server
const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});