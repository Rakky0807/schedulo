/**
 * models/Availability.js
 * Stores the user's weekly availability schedule.
 * Each document = one user's availability (one-to-one with User).
 *
 * Structure: 7 days, each with an array of { start, end } time windows.
 * Times stored as "HH:MM" strings (24-hour, in the user's local timezone).
 */

import mongoose from "mongoose";

const TimeSlotSchema = new mongoose.Schema(
  {
    start: { type: String, required: true }, // "09:00"
    end: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const DayScheduleSchema = new mongoose.Schema(
  {
    isAvailable: { type: Boolean, default: false },
    slots: [TimeSlotSchema],
  },
  { _id: false }
);

const AvailabilitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // 0 = Sunday … 6 = Saturday
    schedule: {
      0: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
      1: {
        type: DayScheduleSchema,
        default: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
      },
      2: {
        type: DayScheduleSchema,
        default: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
      },
      3: {
        type: DayScheduleSchema,
        default: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
      },
      4: {
        type: DayScheduleSchema,
        default: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
      },
      5: {
        type: DayScheduleSchema,
        default: { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] },
      },
      6: { type: DayScheduleSchema, default: { isAvailable: false, slots: [] } },
    },

    // Override specific dates (vacations / holidays)
    dateOverrides: [
      {
        date: String,        // "YYYY-MM-DD"
        isAvailable: Boolean,
        slots: [TimeSlotSchema],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Availability ||
  mongoose.model("Availability", AvailabilitySchema);
