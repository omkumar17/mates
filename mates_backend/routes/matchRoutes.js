const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireProfileComplete =
  require("../middleware/authMiddleware").requireProfileComplete;
const Match = require("../models/match");

const router = express.Router();

const serializeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;

  delete userObj.passwordHash;

  return {
    ...userObj,
    id: userObj._id.toString(),
  };
};

/**
 * GET /api/matches
 * Get all my matches
 */
router.get(
  "/",
  authMiddleware,
  requireProfileComplete,
  async (req, res) => {
    try {
      const myUserId = req.user._id;

      const matches = await Match.find({
        users: myUserId,
      }).populate("users", "-passwordHash");

      const formattedMatches = matches.map((match) => {
        const otherUser = match.users.find(
          (user) =>
            user._id.toString() !== myUserId.toString()
        );

        return {
          matchId: match._id.toString(),
          matchedAt: match.createdAt,
          user: serializeUser(otherUser),
        };
      });

      return res.json(formattedMatches);
    } catch (error) {
      console.error("Get matches error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

/**
 * GET /api/matches/:matchId
 * Get one match
 */
router.get(
  "/:matchId",
  authMiddleware,
  requireProfileComplete,
  async (req, res) => {
    try {
      const { matchId } = req.params;

      const match = await Match.findById(matchId)
        .populate("users", "-passwordHash");

      if (!match) {
        return res.status(404).json({
          message: "Match not found",
        });
      }

      const isMember = match.users.some(
        (user) =>
          user._id.toString() === req.user._id.toString()
      );

      if (!isMember) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      return res.json({
        id: match._id.toString(),
        users: match.users.map(serializeUser),
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
      });
    } catch (error) {
      console.error("Get match error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;