const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },

    // Day 2: profile fields
    age: {
      type: Number,
      min: 18,
      max: 100,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    city: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    interests: [
      {
        type: String,
        trim: true,
      },
    ],
    images: [
      {
        type: String, // image URL
      },
    ],
    preferences: {
      minAge: {
        type: Number,
        default: 18,
      },
      maxAge: {
        type: Number,
        default: 60,
      },
      genders: [{
        type: String,
      }],
      lookingFor: [
        {
          type: String, // e.g. "friendship", "dating", "networking"
        },
      ],
      cityPreference: {
        type: String,
        enum: ["same-city", "nearby", "anywhere"],
        default: "same-city",
      },
    },
    // Track users this user has interacted with
    likedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    dislikedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    seenProfiles: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        lastSeenAt: { type: Date, default: Date.now },
        swipeType: { type: String, enum: ["like", "skip"] }
      }
    ],

    exposureScore: { type: Number, default: 0 },
    lastExposureUpdate: { type: Date, default: Date.now },

    // seenProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    lastNotificationAt: { type: Date, default: null },
    recentProfileViews: { type: Number, default: 0 },
    newMutualMatches: { type: Number, default: 0 },

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
