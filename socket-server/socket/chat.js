const Match = require("../models/match");

module.exports = (io) => {
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

    // Typing indicator
    socket.on("typing", ({ matchId }) => {
      socket.to(matchId).emit("typing");
    });

    // Stop typing indicator
    socket.on("stopTyping", ({ matchId }) => {
      socket.to(matchId).emit("stopTyping");
    });

    // Mark messages as seen
    socket.on("markSeen", ({ matchId }) => {
      socket.to(matchId).emit("seenUpdate");
    });

    // Send and broadcast message
    socket.on("sendMessage", (data) => {
      const { matchId, message } = data;

      socket.to(matchId).emit("receiveMessage", {
        ...message,
        sender: {
          _id: socket.user._id,
          name: socket.user.name,
        },
        createdAt: new Date(),
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.name);
    });
  });
};

