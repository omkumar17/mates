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
    const { targetUserId } = req.params;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({
        message: "You cannot skip yourself.",
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const alreadySeen = await User.findOne({
      _id: currentUserId,
      "seenProfiles.user": targetUserId,
    });

    if (alreadySeen) {
      await User.updateOne(
        {
          _id: currentUserId,
          "seenProfiles.user": targetUserId,
        },
        {
          $set: {
            "seenProfiles.$.lastSeenAt": new Date(),
            "seenProfiles.$.swipeType": "skip",
          },
          $addToSet: {
            dislikedUsers: targetUserId,
          },
        }
      );
    } else {
      await User.updateOne(
        { _id: currentUserId },
        {
          $push: {
            seenProfiles: {
              user: targetUserId,
              swipeType: "skip",
              lastSeenAt: new Date(),
            },
          },
          $addToSet: {
            dislikedUsers: targetUserId,
          },
        }
      );
    }

    res.json({
      message: "Profile skipped.",
    });
  } catch (err) {
    console.error("Skip error:", err);

    res.status(500).json({
      message: "Server error",
    });
  }
});
module.exports = router;
