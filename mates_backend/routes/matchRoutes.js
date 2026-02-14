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

router.get("/:matchId", authMiddleware, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("users", "name email");



    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    console.log(match)

    // Security: only allow if user is part of match
    const isMember = match.users.some(
      (u) => u._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(match);
  } catch (error) {
    console.error("Get match error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
