const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireProfileComplete = require("../middleware/authMiddleware").requireProfileComplete;
const Like = require("../models/like");
const Match = require("../models/match");
const User = require("../models/user");
const { calculateIntentWeight } = require("../services/intentAlgorithm");

const router = express.Router();

router.post("/skip/:targetUserId", authMiddleware, requireProfileComplete, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.targetUserId;

    // Add to seenProfiles
    await User.updateOne(
      { _id: currentUserId },
      {
        $push: {
          seenProfiles: {
            user: targetUserId,
            swipeType: "skip",
            lastSeenAt: Date.now(),
          },
        },
        $addToSet: { dislikedUsers: targetUserId },
      }
    );

    res.json({ message: "Skipped" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;
