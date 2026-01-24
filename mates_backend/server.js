const express=require("express");
const cors=require("cors");
const dotenv=require("dotenv");
const connectDB=require("./config/db");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("./models/user");
const Match = require("./models/match");

dotenv.config(); //load env

connectDB();  //connect db

const app=express();

//middleware

app.use(cors());
app.use(express.json());  //parse body as json

//routes

app.get("/",(req,res)=>{
    res.send("mates API is running");
})

const authRoutes=require("./routes/authRoutes");
app.use("/api/auth",authRoutes);

const userRoutes=require("./routes/userRoutes");
// console.log("typeof userRoutes:", typeof userRoutes);
app.use("/api/user",userRoutes);

const likeRoutes = require("./routes/likeRoutes");
app.use("/api/likes", likeRoutes);

const matchRoutes = require("./routes/matchRoutes");
app.use("/api/matches", matchRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/api/messages", messageRoutes);




//error handling

app.use((err,req,res,next)=>{
    console.error("Global error handler:", err);
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Server error" });
});



const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // later restrict this
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-passwordHash");

    if (!user) {
      return next(new Error("User not found"));
    }

    // Attach user to socket
    socket.user = user;

    next();
  } catch (error) {
    console.error("Socket auth error:", error.message);
    next(new Error("Authentication failed"));
  }
});


io.on("connection", (socket) => {
  console.log("Authenticated user connected:", socket.user.name);

  // Join match room
  socket.on("joinRoom", async (matchId) => {
  try {
    const match = await Match.findOne({
      _id: matchId,
      users: socket.user._id,
    });

    if (!match) {
      return socket.emit("errorMessage", "Not authorized to join this room");
    }

    socket.join(matchId);
    console.log(`${socket.user.name} joined room ${matchId}`);
  } catch (error) {
    console.error("Join room error:", error.message);
  }
});


  // Receive message
  socket.on("sendMessage", (data) => {
    const { matchId, message } = data;

    // Broadcast to others in room
    socket.to(matchId).emit("receiveMessage", {
      ...message,
      sender: {
        _id: socket.user._id,
        name: socket.user.name,
      },
      createdAt: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.name);
  });
});


const PORT=process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

