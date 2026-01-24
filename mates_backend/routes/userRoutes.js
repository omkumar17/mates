const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

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
module.exports = router;