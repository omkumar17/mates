const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Message = require("../models/message");
const Match = require("../models/match");

const router = express.Router();

/**
 * POST /api/messages/:matchId
 * Send a message
 */
router.post("/:matchId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const matchId = req.params.matchId;
    const senderId = req.user._id;

    if (!text) {
      return res.status(400).json({ message: "Message text required" });
    }

    // Verify user belongs to this match
    const match = await Match.findOne({
      _id: matchId,
      users: senderId,
    });

    if (!match) {
      return res.status(403).json({ message: "Not authorized for this match" });
    }

    const message = await Message.create({
      match: matchId,
      sender: senderId,
      text,
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET /api/messages/:matchId
 * Get messages for a match
 */
router.get("/:matchId", authMiddleware, async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user._id;

    // Verify user belongs to this match
    const match = await Match.findOne({
      _id: matchId,
      users: userId,
    });

    if (!match) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.find({
      match: matchId,
    })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
