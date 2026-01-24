const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Like = require("../models/like");
const Match = require("../models/match");

const router = express.Router();

/**
 * @route   POST /api/likes/:targetUserId
 * @desc    Like a user & create match if mutual
 * @access  Private
 */
router.post("/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user._id;           // logged-in user
    const toUserId = req.params.targetUserId; // user being liked

    // 1️⃣ Prevent liking yourself
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You cannot like yourself" });
    }

    // 2️⃣ Check if already liked
    const alreadyLiked = await Like.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: "User already liked" });
    }

    // 3️⃣ Create like
    await Like.create({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    // 4️⃣ Check for reverse like
    const reverseLike = await Like.findOne({
      fromUser: toUserId,
      toUser: fromUserId,
    });

    // 5️⃣ If reverse like exists → create match
    if (reverseLike) {
      const existingMatch = await Match.findOne({
        users: { $all: [fromUserId, toUserId] },
      });

      if (!existingMatch) {
        await Match.create({
          users: [fromUserId, toUserId],
        });
      }

      return res.json({
        message: "It's a match!",
        matched: true,
      });
    }

    // 6️⃣ If no match yet
    res.json({
      message: "User liked successfully",
      matched: false,
    });
  } catch (error) {
    console.error("Like user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
