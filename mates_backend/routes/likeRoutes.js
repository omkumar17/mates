const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const requireProfileComplete =
  require("../middleware/authMiddleware").requireProfileComplete;

const Like = require("../models/like");
const Match = require("../models/match");
const User = require("../models/user");

const { calculateIntentWeight } = require("../services/intentAlgorithm");

const router = express.Router();

/**
 * @route   POST /api/likes/:targetUserId
 * @desc    Like a user & create match if mutual
 * @access  Private
 */
router.post(
  "/:targetUserId",
  authMiddleware,
  requireProfileComplete,
  async (req, res) => {
    try {
      const fromUserId = req.user._id;
      const { targetUserId: toUserId } = req.params;

      const {
        viewTimeMs = 5000,
        interactionDepth = 1,
      } = req.body;

      // =============================
      // Prevent liking yourself
      // =============================
      if (fromUserId.toString() === toUserId) {
        return res.status(400).json({
          message: "You cannot like yourself",
        });
      }

      // =============================
      // Check target user exists
      // =============================
      const targetUser = await User.findById(toUserId);

      if (!targetUser) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // =============================
      // Prevent duplicate likes
      // =============================
      const alreadyLiked = await Like.findOne({
        fromUser: fromUserId,
        toUser: toUserId,
      });

      if (alreadyLiked) {
        return res.status(400).json({
          message: "User already liked",
        });
      }

      // =============================
      // Update liked/disliked arrays
      // =============================
      await User.updateOne(
        { _id: fromUserId },
        {
          $addToSet: {
            likedUsers: toUserId,
          },
          $pull: {
            dislikedUsers: toUserId,
          },
        }
      );

      // =============================
      // Update seenProfiles
      // =============================
      const alreadySeen = await User.findOne({
        _id: fromUserId,
        "seenProfiles.user": toUserId,
      });

      if (alreadySeen) {
        await User.updateOne(
          {
            _id: fromUserId,
            "seenProfiles.user": toUserId,
          },
          {
            $set: {
              "seenProfiles.$.lastSeenAt": new Date(),
              "seenProfiles.$.swipeType": "like",
            },
          }
        );
      } else {
        await User.updateOne(
          { _id: fromUserId },
          {
            $push: {
              seenProfiles: {
                user: toUserId,
                swipeType: "like",
                lastSeenAt: new Date(),
              },
            },
          }
        );
      }

      // =============================
      // Anti-spam burst detection
      // =============================
      const recentLikeCount = await Like.countDocuments({
        fromUser: fromUserId,
        createdAt: {
          $gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      });

      const weight = calculateIntentWeight({
        viewTimeMs,
        interactionDepth,
        recentLikeCount,
      });

      // =============================
      // Create Like
      // =============================
      await Like.create({
        fromUser: fromUserId,
        toUser: toUserId,
        weight,
      });

      // =============================
      // Update exposure
      // =============================
      await User.updateOne(
        { _id: toUserId },
        {
          $inc: {
            exposureScore: weight,
            recentProfileViews: 1,
          },
        }
      );

      // =============================
      // Check reverse like
      // =============================
      const reverseLike = await Like.findOne({
        fromUser: toUserId,
        toUser: fromUserId,
      });

      if (reverseLike) {
        const existingMatch = await Match.findOne({
          users: {
            $all: [fromUserId, toUserId],
          },
        });

        if (!existingMatch) {
          await Match.create({
            users: [fromUserId, toUserId],
          });

          await User.updateMany(
            {
              _id: {
                $in: [fromUserId, toUserId],
              },
            },
            {
              $inc: {
                newMutualMatches: 1,
              },
            }
          );
        }

        return res.json({
          matched: true,
          weight,
          message: "It's a match!",
        });
      }

      // =============================
      // Like only
      // =============================
      return res.json({
        matched: false,
        weight,
        message: "User liked successfully",
      });

    } catch (error) {
      console.error("Like user error:", error);

      return res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;