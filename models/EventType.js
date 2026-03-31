/**
 * models/EventType.js
 * Represents a schedulable event (e.g. "30-min call", "1-hr consultation").
 * Each user can have multiple event types with unique slugs.
 */

import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ["text", "textarea", "select"], default: "text" },
  options: [String], // for "select" type
  required: { type: Boolean, default: false },
});

const EventTypeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Display info
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9-]+$/,
    },
    description: { type: String, default: "" },
    color: { type: String, default: "#4f46e5" },

    // Duration in minutes (15, 30, 45, 60, 90, 120)
    duration: { type: Number, required: true, default: 30 },

    // Buffer time in minutes before/after each meeting
    bufferBefore: { type: Number, default: 0 },
    bufferAfter: { type: Number, default: 0 },

    // How far in advance can people book (in days)
    advanceNotice: { type: Number, default: 1 }, // min hours before booking
    bookingWindow: { type: Number, default: 60 }, // days into future allowed

    // Max bookings per day (0 = unlimited)
    maxPerDay: { type: Number, default: 0 },

    // Location / video call link
    locationType: {
      type: String,
      enum: ["google_meet", "zoom", "phone", "in_person", "custom"],
      default: "google_meet",
    },
    locationValue: { type: String, default: "" }, // custom address or link

    // Custom intake questions shown during booking
    questions: [QuestionSchema],

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Each user can only have one event type per slug
EventTypeSchema.index({ userId: 1, slug: 1 }, { unique: true });

export default mongoose.models.EventType ||
  mongoose.model("EventType", EventTypeSchema);
