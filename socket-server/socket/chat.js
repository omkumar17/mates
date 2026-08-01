const Match = require("../models/match");
const Message = require("../models/message");

const serializeSender = (sender) => ({
  _id: sender._id,
  id: sender._id.toString(),
  name: sender.name,
});

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Authenticated user connected:", socket.user.name);

    /**
     * Join Match Room
     */
    socket.on("joinRoom", async (matchId) => {
      try {
        const match = await Match.findOne({
          _id: matchId,
          users: socket.user._id,
        });

        if (!match) {
          return socket.emit(
            "errorMessage",
            "Not authorized to join this room"
          );
        }

        socket.join(matchId);

        console.log(`${socket.user.name} joined room ${matchId}`);
      } catch (error) {
        console.error("Join room error:", error);
      }
    });

    /**
     * Typing
     */
    socket.on("typing", ({ matchId }) => {
      socket.to(matchId).emit("typing");
    });

    /**
     * Stop Typing
     */
    socket.on("stopTyping", ({ matchId }) => {
      socket.to(matchId).emit("stopTyping");
    });

    /**
     * Mark Seen
     */
    socket.on("markSeen", async ({ matchId }) => {
      try {
        const match = await Match.findOne({
          _id: matchId,
          users: socket.user._id,
        });

        if (!match) return;

        const unseenMessages = await Message.find({
          match: matchId,
          sender: { $ne: socket.user._id },
          seen: false,
        });

        const ids = unseenMessages.map((m) => m._id);

        if (!ids.length) return;

        await Message.updateMany(
          {
            _id: { $in: ids },
          },
          {
            $set: {
              seen: true,
            },
          }
        );

        io.to(matchId).emit("seenUpdate", ids);
      } catch (err) {
        console.error("Mark seen error:", err);
      }
    });

    /**
     * Send Message
     */
    socket.on("sendMessage", async ({ matchId, message }) => {
      try {
        // Validate message
        if (!message?.text?.trim()) {
          return socket.emit(
            "errorMessage",
            "Message cannot be empty"
          );
        }

        // Verify match membership
        const match = await Match.findOne({
          _id: matchId,
          users: socket.user._id,
        });

        if (!match) {
          return socket.emit(
            "errorMessage",
            "Unauthorized"
          );
        }

        // Save message
        const savedMessage = await Message.create({
          match: matchId,
          sender: socket.user._id,
          text: message.text.trim(),
        });

        // Populate sender
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate("sender", "name");

        const msg = populatedMessage.toObject();

        msg.sender = serializeSender(msg.sender);

        // Broadcast
        io.to(matchId).emit("receiveMessage", msg);
      } catch (err) {
        console.error("Send message error:", err);

        socket.emit(
          "errorMessage",
          "Failed to send message"
        );
      }
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", () => {
      console.log(
        "User disconnected:",
        socket.user.name
      );
    });
  });
};