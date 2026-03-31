/**
 * app/api/bookings/route.js
 * POST — create a new booking (public, no auth required for invitee)
 * GET  — list bookings for the authenticated host
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import EventType from "@/models/EventType";
import User from "@/models/User";
import Availability from "@/models/Availability";
import { generateSlots } from "@/lib/slots";
import { createCalendarEvent } from "@/lib/googleCalendar";
import { sendBookingConfirmation } from "@/lib/email";
import { generateToken } from "@/lib/utils";
import { addDays } from "date-fns";
import { format, toZonedTime } from "date-fns-tz";

// GET /api/bookings — for authenticated host dashboard
export async function GET(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "confirmed";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  await connectDB();

  const bookings = await Booking.find({
    hostId: session.user.id,
    status,
  })
    .populate("eventTypeId", "title duration color locationType")
    .sort({ startTime: status === "confirmed" ? 1 : -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const total = await Booking.countDocuments({
    hostId: session.user.id,
    status,
  });

  return NextResponse.json({ bookings, total, page, limit });
}

// POST /api/bookings — public booking creation
export async function POST(request) {
  const body = await request.json();
  const {
    username,
    eventSlug,
    utcStart,
    utcEnd,
    inviteeName,
    inviteeEmail,
    inviteeTimezone,
    notes,
    answers,
  } = body;

  // Validate required fields
  if (!username || !eventSlug || !utcStart || !inviteeName || !inviteeEmail) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await connectDB();

  // Resolve host and event type
  const host = await User.findOne({ username });
  if (!host) return NextResponse.json({ error: "Host not found" }, { status: 404 });

  const eventType = await EventType.findOne({
    userId: host._id,
    slug: eventSlug,
    isActive: true,
  });
  if (!eventType) return NextResponse.json({ error: "Event type not found" }, { status: 404 });

  // ── Double-check the slot is still available ─────────────────────────────
  const startTime = new Date(utcStart);
  const dateStr = format(toZonedTime(startTime, host.timezone || "UTC"), "yyyy-MM-dd");

  const availability = await Availability.findOne({ userId: host._id });
  const existingBookings = await Booking.find({
    hostId: host._id,
    status: "confirmed",
    startTime: { $gte: addDays(startTime, -1), $lt: addDays(startTime, 1) },
  }).select("startTime endTime");

  const availableSlots = generateSlots({
    dateStr,
    availability,
    duration: eventType.duration,
    bufferBefore: eventType.bufferBefore,
    bufferAfter: eventType.bufferAfter,
    advanceNotice: eventType.advanceNotice,
    existingBookings,
    hostTimezone: host.timezone || "UTC",
    inviteeTimezone: inviteeTimezone || "UTC",
  });

  const isStillAvailable = availableSlots.some(
    (s) => Math.abs(new Date(s.utcStart) - startTime) < 60000 // 1 min tolerance
  );

  if (!isStillAvailable) {
    return NextResponse.json(
      { error: "This slot is no longer available. Please choose another time." },
      { status: 409 }
    );
  }

  // ── Create booking document ───────────────────────────────────────────────
  const booking = await Booking.create({
    eventTypeId: eventType._id,
    hostId: host._id,
    inviteeName: inviteeName.trim(),
    inviteeEmail: inviteeEmail.toLowerCase().trim(),
    inviteeTimezone: inviteeTimezone || "UTC",
    startTime,
    endTime: new Date(utcEnd),
    notes: notes || "",
    answers: answers || [],
    cancelToken: generateToken(),
    location:
      eventType.locationType === "google_meet"
        ? "Google Meet (link will be in calendar invite)"
        : eventType.locationValue || "To be determined",
  });

  // ── Create Google Calendar event (non-blocking) ───────────────────────────
  if (host.googleAccessToken) {
    try {
      const eventId = await createCalendarEvent({
        accessToken: host.googleAccessToken,
        refreshToken: host.googleRefreshToken,
        booking,
        eventType,
        attendeeEmail: inviteeEmail,
        attendeeName: inviteeName,
        hostName: host.name,
      });
      if (eventId) {
        await Booking.findByIdAndUpdate(booking._id, { hostGoogleEventId: eventId });
      }
    } catch (err) {
      console.error("Calendar sync failed (non-fatal):", err.message);
    }
  }

  // ── Send confirmation emails (non-blocking) ───────────────────────────────
  try {
    await sendBookingConfirmation({ booking, eventType, host });
  } catch (err) {
    console.error("Email failed (non-fatal):", err.message);
  }

  return NextResponse.json({ booking, bookingId: booking._id }, { status: 201 });
}
