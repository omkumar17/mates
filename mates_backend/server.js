const express=require("express");
const cors=require("cors");
const dotenv=require("dotenv");
const connectDB=require("./config/db");

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

const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // later restrict this
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join match room
  socket.on("joinRoom", (matchId) => {
    socket.join(matchId);
    console.log(`Socket joined room: ${matchId}`);
  });

  // Receive message
  socket.on("sendMessage", (data) => {
    const { matchId, message } = data;

    // Send message to everyone in room except sender
    socket.to(matchId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


const PORT=process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

