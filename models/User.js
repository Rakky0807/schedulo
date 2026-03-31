/**
 * models/User.js
 * Core user document. Stores profile, timezone, and Google Calendar tokens.
 */

import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    // NextAuth fills these automatically for OAuth users
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String },

    // Password only set for credentials (email/password) users
    password: { type: String, select: false },

    // Unique public slug: schedulo.app/johndoe
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_-]{3,30}$/,
    },

    // Scheduling preferences
    timezone: { type: String, default: "UTC" },
    welcomeMessage: { type: String, default: "" },

    // Google Calendar OAuth tokens (stored after connecting calendar)
    googleAccessToken: { type: String },
    googleRefreshToken: { type: String },
    googleTokenExpiry: { type: Date },
    calendarConnected: { type: Boolean, default: false },

    // Profile
    bio: { type: String, maxlength: 300 },
    avatarColor: {
      type: String,
      default: () =>
        ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"][
          Math.floor(Math.random() * 5)
        ],
    },
  },
  {
    timestamps: true,
    // NextAuth adapter uses "users" collection by default
    collection: "users",
  }
);

// Prevent model re-compilation during hot reload
export default mongoose.models.User || mongoose.model("User", UserSchema);
