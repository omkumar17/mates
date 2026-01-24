const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");
const Like = require("../models/like");
const Match = require("../models/match");


const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current logged-in user's profile
// @access  Private

router.get("/me", authMiddleware, async (req, res) => {
    try {
        return res.json(req.user);
    } catch (error) {
        console.error("error getting profile", error);
        res.status(500).json({ message: "Server error" });
    }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile
// @access  Private

router.put("/me", authMiddleware, async (req, res) => {
    try {
        const { age, gender, city, bio, interests, preferences } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // update fields only if provided
        if (age !== undefined) user.age = age;
        if (gender !== undefined) user.gender = gender;
        if (city !== undefined) user.city = city;
        if (bio !== undefined) user.bio = bio;
        if (interests !== undefined) user.interests = interests;
        if (preferences !== undefined) {
            user.preferences = {
                ...user.preferences,
                ...preferences,
            };
        }

        const updatedUser = await user.save();

        const { passwordHash, ...userData } = updatedUser.toObject();
        res.json({
            message: "Profile updated successfully",
            user: userData,
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

/**
 * @route   GET /api/user/discover
 * @desc    Discover new users
 * @access  Private
 */
router.get("/discover", authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;

    // 1️⃣ Get users I have already liked
    const likedUsers = await Like.find({ fromUser: currentUserId }).select("toUser");

    const likedUserIds = likedUsers.map(like => like.toUser);

    // 2️⃣ Get users I am already matched with
    const matches = await Match.find({ users: currentUserId });

    const matchedUserIds = matches.flatMap(match =>
      match.users.filter(id => id.toString() !== currentUserId.toString())
    );

    // 3️⃣ Exclude myself, liked users, matched users
    const excludedIds = [
      currentUserId,
      ...likedUserIds,
      ...matchedUserIds
    ];

    // 4️⃣ Find remaining users
    const users = await User.find({
      _id: { $nin: excludedIds }
    }).select("-passwordHash");

    res.json(users);

  } catch (error) {
    console.error("Discover users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;