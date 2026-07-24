const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Like = require("../models/like");
const Match = require("../models/match");
const User = require("../models/user");
const { calculateIntentWeight } = require("../services/intentAlgorithm");

const router = express.Router();

router.post("/skip/:targetUserId", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);

    currentUser.seenProfiles.push({
      user: req.params.targetUserId,
      swipeType: "skip",
      lastSeenAt: Date.now(),
    });

    await currentUser.save();

    res.json({ message: "Skipped" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports = router;