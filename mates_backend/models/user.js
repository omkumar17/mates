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
    preferences: {
      minAge: {
        type: Number,
        default: 18,
      },
      maxAge: {
        type: Number,
        default: 60,
      },
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
