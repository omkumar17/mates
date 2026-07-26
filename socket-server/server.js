const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Restrict in production
  },
});

// Authentication middleware for sockets
io.use(require("./socket/auth"));

// Chat logic
require("./socket/chat")(io);

// Health check route
app.get("/", (req, res) => {
  res.send("Socket server is running");
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});

