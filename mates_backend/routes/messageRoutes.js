const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Message = require("../models/message");
const Match = require("../models/match");

const router = express.Router();

const serializeSender = (sender) => ({
  _id: sender._id,
  id: sender._id.toString(),
  name: sender.name,
});

/**
 * POST /api/messages/:matchId
 * Send a message
 */
router.post("/:matchId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const { matchId } = req.params;
    const senderId = req.user._id;

    // =============================
    // Validation
    // =============================
    if (!text?.trim()) {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        message: "Message is too long",
      });
    }

    // =============================
    // Verify user belongs to match
    // =============================
    const match = await Match.findOne({
      _id: matchId,
      users: senderId,
    });

    if (!match) {
      return res.status(403).json({
        message: "Not authorized for this match",
      });
    }

    // =============================
    // Create Message
    // =============================
    const message = await Message.create({
      match: matchId,
      sender: senderId,
      text: text.trim(),
    });

    // =============================
    // Populate sender
    // =============================
    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name");

    const messageObj = populatedMessage.toObject();

    messageObj.sender = serializeSender(messageObj.sender);

    return res.status(201).json(messageObj);

  } catch (error) {
    console.error("Send message error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

/**
 * GET /api/messages/:matchId
 * Get messages of a match
 */
router.get("/:matchId", authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user._id;

    // =============================
    // Verify user belongs to match
    // =============================
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
    });

    if (!match) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    // =============================
    // Fetch Messages
    // =============================
    const messages = await Message.find({
      match: matchId,
    })
      .populate("sender", "name")
      .sort({ createdAt: 1 })
      .lean();

    // =============================
    // Serialize sender
    // =============================
    const formattedMessages = messages.map((msg) => ({
      ...msg,
      sender: serializeSender(msg.sender),
    }));

    return res.json(formattedMessages);

  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;