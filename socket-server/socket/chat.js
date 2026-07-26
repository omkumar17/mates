const Match = require("../models/match");
const Message = require("../models/message");

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
    socket.on("markSeen", async ({ matchId }) => {
      try {
        const unseenMessages = await Message.find({
          match: matchId,
          sender: { $ne: socket.user._id },
          seen: false,
        });

        const ids = unseenMessages.map((m) => m._id);

        await Message.updateMany(
          {
            _id: { $in: ids },
          },
          {
            $set: { seen: true },
          }
        );

        io.to(matchId).emit("seenUpdate", ids);
      } catch (err) {
        console.error("Mark seen error:", err);
      }
    });

    // Send and broadcast message
    socket.on("sendMessage", async ({ matchId, message }) => {
      try {

        const match = await Match.findOne({
          _id: matchId,
          users: socket.user._id,
        });

        if (!match) {
          return socket.emit("errorMessage", "Unauthorized");
        }

        const savedMessage = await Message.create({
          match: matchId,
          sender: socket.user._id,
          text: message.text,
        });

        io.to(matchId).emit("receiveMessage", {
          _id: savedMessage._id,
          text: savedMessage.text,
          sender: {
            _id: socket.user._id,
            name: socket.user.name,
          },
          createdAt: savedMessage.createdAt,
          seen: false,
        });

      } catch (err) {
        console.error(err);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.user.name);
    });
  });
};

