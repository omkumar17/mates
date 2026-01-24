const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Match = require("../models/match");

const router = express.Router();

/**
 * @route   GET /api/matches
 * @desc    Get my matches
 * @access  Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const myUserId = req.user._id;

    const matches = await Match.find({
      users: myUserId,
    }).populate("users", "-passwordHash");

    // Extract the other user from each match
    const formattedMatches = matches.map(match => {
      const otherUser = match.users.find(
        user => user._id.toString() !== myUserId.toString()
      );

      return {
        matchId: match._id,
        user: otherUser,
        matchedAt: match.createdAt,
      };
    });

    res.json(formattedMatches);
  } catch (error) {
    console.error("Get matches error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
