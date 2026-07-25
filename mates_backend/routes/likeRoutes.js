const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Like = require("../models/like");
const Match = require("../models/match");
const User = require("../models/user");
const { calculateIntentWeight } = require("../services/intentAlgorithm");

const router = express.Router();

/**
 * @route   POST /api/likes/:targetUserId
 * @desc    Like a user & create match if mutual (Intent Weighted)
 * @access  Private
 */
router.post("/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user._id;
    const toUserId = req.params.targetUserId;

    const { viewTimeMs = 5000, interactionDepth = 1 } = req.body;

  // 1️⃣ Prevent liking yourself
    if (fromUserId.toString() === toUserId) {
      return res.status(400).json({ message: "You cannot like yourself" });
    }

  // 1.5️⃣ Check if already liked
    const alreadyLiked = await Like.findOne({
      fromUser: fromUserId,
      toUser: toUserId,
    });

    if (alreadyLiked) {
      return res.status(400).json({ message: "User already liked" });
    }

  // 1.6️⃣ Add to current user's likedUsers array
    await User.updateOne(
      { _id: fromUserId },
      { $addToSet: { likedUsers: toUserId } }
    );

    // 3️⃣ Anti-spam burst detection
    const recentLikeCount = await Like.countDocuments({
      fromUser: fromUserId,
      createdAt: { $gte: Date.now() - 5 * 60 * 1000 },
    });

    const weight = calculateIntentWeight({
      viewTimeMs,
      interactionDepth,
      recentLikeCount,
    });

    // 4️⃣ Create Like
    await Like.create({
      fromUser: fromUserId,
      toUser: toUserId,
      weight,
    });

    // 5️⃣ Atomic exposure + view increment
    await User.updateOne(
      { _id: toUserId },
      {
        $inc: {
          exposureScore: weight,
          recentProfileViews: 1,
        },
      }
    );

    // 6️⃣ Check reverse like
    const reverseLike = await Like.findOne({
      fromUser: toUserId,
      toUser: fromUserId,
    });

    if (reverseLike) {
      const existingMatch = await Match.findOne({
        users: { $all: [fromUserId, toUserId] },
      });

      if (!existingMatch) {
        await Match.create({
          users: [fromUserId, toUserId],
        });
      }

      // 7️⃣ Atomic mutual match increment
      await User.updateMany(
        { _id: { $in: [fromUserId, toUserId] } },
        { $inc: { newMutualMatches: 1 } }
      );

      return res.json({
        message: "It's a match!",
        matched: true,
        weight,
      });
    }

    // 8️⃣ No match (silent model)
    res.json({
      message: "User liked successfully",
      matched: false,
      weight,
    });

  } catch (error) {
    console.error("Like user error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
