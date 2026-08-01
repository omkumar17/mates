const express = require("express");
const { applyDecay, calculatePriority } = require("../services/feedAlgorithm");
// const { applyDecay, calculatePriority } = require("../services/fairnessService");
const { preferenceFilter } = require("../services/preferenceFilter");
const authMiddleware = require("../middleware/authMiddleware");
const requireProfileComplete = require("../middleware/authMiddleware").requireProfileComplete;
const User = require("../models/user");
const Like = require("../models/like");
const Match = require("../models/match");
const imageService = require("../services/imageService");


const router = express.Router();

const serializeUser = (user) => {
    const userObj = user.toObject ? user.toObject() : user;

    delete userObj.passwordHash;

    return {
        ...userObj,
        id: userObj._id.toString(),
    };
};

// @route   GET /api/users/me
// @desc    Get current logged-in user's profile
// @access  Private

router.get("/me", authMiddleware, async (req, res) => {
    try {
        return res.json(serializeUser(req.user));
    } catch (error) {
        console.error("Error getting profile:", error);
        return res.status(500).json({
            message: "Server error",
        });
    }
});

// @route   PUT /api/users/me
// @desc    Update current user's profile
// @access  Private

router.put("/me", authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, age, gender, city, bio, interests, preferences, images } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (email && email !== user.email) {
            const existing = await User.findOne({ email });

            if (existing) {
                return res.status(400).json({
                    message: "Email already exists",
                });
            }
        }


        // =============================
        // Handle Image Updates with Cloudinary Cleanup
        // =============================
        if (images !== undefined) {
            // Delete images that are no longer in use
            await imageService.deleteUnusedImages(user.images, images);
            user.images = images;
        }

        // =============================
        // Update Other Fields
        // =============================
        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;
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

        // =============================
        // 🔥 PROFILE COMPLETION VALIDATION
        // =============================
        if (
            !user.age ||
            !user.email ||
            !user.name ||
            !user.gender ||
            !user.city ||
            !user.bio ||
            !user.images ||
            user.images.length < 1
        ) {
            return res.status(400).json({
                message: "Complete your profile. All fields including age, gender, city, bio, and at least one image are required.",
            });
        }

        user.profileCompleted = true;
        const updatedUser = await user.save();

        const { passwordHash, ...userData } = updatedUser.toObject();

        res.json({
            message: "Profile updated successfully",
            user: serializeUser(updatedUser),
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
router.get("/discover", authMiddleware, requireProfileComplete, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user._id);
        const currentUserId = currentUser._id;

        // 1️⃣ Get liked users
        const likedUsers = await Like.find({
            fromUser: currentUserId
        }).select("toUser");

        const likedUserIds = likedUsers.map(like =>
            like.toUser.toString()
        );

        // 2️⃣ Get matched users
        const matches = await Match.find({
            users: currentUserId
        });

        const matchedUserIds = matches.flatMap(match =>
            match.users
                .filter(id => id.toString() !== currentUserId.toString())
                .map(id => id.toString())
        );

        // 3️⃣ Base exclusions
        const baseExcludedIds = [
            currentUserId.toString(),
            ...likedUserIds,
            ...matchedUserIds
        ];

        // 4️⃣ Get all other active users
        const preferredGenders = currentUser.preferences?.genders?.length
            ? currentUser.preferences.genders
            : ["male", "female", "other"];

        const allUsers = await User.find({
            _id: { $nin: baseExcludedIds },
            isActive: true,
            gender: { $in: preferredGenders }
        }).select("-passwordHash");

        console.log(`\nTotal users fetched: ${allUsers.length}`);

        // 🔥 Apply comprehensive preference filter BEFORE feed algorithm
        const filteredUsers = preferenceFilter(currentUser, allUsers);
        console.log(`After preference filter: ${filteredUsers.length} users remain`);

        const poolSize = filteredUsers.length;

        // 5️⃣ Create map of seen profiles
        const seenMap = new Map();
        (currentUser.seenProfiles || []).forEach(record => {
            seenMap.set(record.user.toString(), record);
        });

        const ranked = [];

        for (let user of filteredUsers) {

            user = applyDecay(user);

            const seenRecord = seenMap.get(user._id.toString());

            let allowReappear = false;

            if (seenRecord) {
                const timeSinceSeen =
                    Date.now() - new Date(seenRecord.lastSeenAt).getTime();

                const cooldownPassed =
                    timeSinceSeen > 7 * 24 * 60 * 60 * 1000; // 7 days

                const lowExposure = user.exposureScore < 5;

                const poolLow = poolSize < 15;

                if ((cooldownPassed || poolLow) && lowExposure) {
                    allowReappear = true;
                } else {
                    continue;
                }
            }

            const priority = calculatePriority(user, poolSize);

            ranked.push({
                user,
                priority,
                reappear: !!seenRecord
            });
        }
        console.log("\nBefore Sorting:");
        ranked.forEach(r => {
            console.log({
                name: r.user.name,
                user: r.user,
                exposure: r.user.exposureScore.toFixed(2),
                priority: r.priority.toFixed(2),
                reappear: r.reappear
            });
        });

        // 6️⃣ Sort by priority
        ranked.sort((a, b) => b.priority - a.priority);

        // 7️⃣ Deep stack logic
        const fresh = ranked.filter(r => !r.reappear);
        const recycled = ranked.filter(r => r.reappear);

        const finalFeed = [
            ...fresh,
            ...recycled
        ].slice(0, 20);

        // 8️⃣ Update exposure
        for (let item of finalFeed) {
            item.user.exposureScore += 1;
            await item.user.save();
        }

        res.json(
            finalFeed.map(f => serializeUser(f.user))
        );

    } catch (error) {
        console.error("Discover users error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
