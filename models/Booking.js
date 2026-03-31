/**
 * models/Booking.js
 * Represents a confirmed (or pending/cancelled) appointment.
 */

import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
  {
    eventTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
      index: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Invitee details (no account needed)
    inviteeName: { type: String, required: true },
    inviteeEmail: { type: String, required: true, lowercase: true },
    inviteeTimezone: { type: String, default: "UTC" },

    // Booking time (stored as UTC)
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },

    // Notes / custom question answers
    notes: { type: String, default: "" },
    answers: [
      {
        questionLabel: String,
        answer: String,
      },
    ],

    // Status lifecycle: confirmed → cancelled / rescheduled
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "rescheduled"],
      default: "confirmed",
    },

    // Google Calendar event IDs (for sync)
    hostGoogleEventId: { type: String },
    inviteeGoogleEventId: { type: String },

    // Unique token for cancel/reschedule links in emails
    cancelToken: { type: String, unique: true },

    // Location determined from event type at booking time
    location: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Booking ||
  mongoose.model("Booking", BookingSchema);
