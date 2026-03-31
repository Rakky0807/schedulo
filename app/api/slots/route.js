/**
 * app/api/slots/route.js
 * Public endpoint — returns available time slots for a specific host + event type + date.
 *
 * Query params:
 *   username      - host's username
 *   eventSlug     - event type slug
 *   date          - "YYYY-MM-DD" in the host's timezone
 *   timezone      - invitee's IANA timezone (for display)
 */

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import EventType from "@/models/EventType";
import Availability from "@/models/Availability";
import Booking from "@/models/Booking";
import { generateSlots } from "@/lib/slots";
import { addDays } from "date-fns";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const eventSlug = searchParams.get("eventSlug");
  const dateStr = searchParams.get("date");
  const inviteeTimezone = searchParams.get("timezone") || "UTC";

  if (!username || !eventSlug || !dateStr) {
    return NextResponse.json({ error: "Missing required params" }, { status: 400 });
  }

  await connectDB();

  // Resolve host
  const host = await User.findOne({ username });
  if (!host) return NextResponse.json({ error: "Host not found" }, { status: 404 });

  // Resolve event type
  const eventType = await EventType.findOne({
    userId: host._id,
    slug: eventSlug,
    isActive: true,
  });
  if (!eventType) return NextResponse.json({ error: "Event type not found" }, { status: 404 });

  // Get availability schedule
  const availability = await Availability.findOne({ userId: host._id });
  if (!availability) return NextResponse.json({ slots: [] });

  // Get existing bookings for that day (+/- buffer to catch edge cases)
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = addDays(dayStart, 1);

  const existingBookings = await Booking.find({
    hostId: host._id,
    status: "confirmed",
    startTime: { $gte: dayStart, $lt: dayEnd },
  }).select("startTime endTime");

  // Generate available slots
  const slots = generateSlots({
    dateStr,
    availability,
    duration: eventType.duration,
    bufferBefore: eventType.bufferBefore,
    bufferAfter: eventType.bufferAfter,
    advanceNotice: eventType.advanceNotice,
    existingBookings,
    hostTimezone: host.timezone || "UTC",
    inviteeTimezone,
  });

  return NextResponse.json({ slots, hostTimezone: host.timezone });
}
