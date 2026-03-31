/**
 * app/api/bookings/[id]/route.js
 * GET    — get booking details (public, with token)
 * DELETE — cancel a booking (public, with cancel token)
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import EventType from "@/models/EventType";
import User from "@/models/User";
import { deleteCalendarEvent } from "@/lib/googleCalendar";
import { sendCancellationEmail } from "@/lib/email";

// GET /api/bookings/:id — fetch booking (host auth OR cancel token)
export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  await connectDB();

  const booking = await Booking.findById(params.id)
    .populate("eventTypeId")
    .populate("hostId", "name email timezone image username");

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Allow access via cancel token (public) or authenticated host
  const session = await auth();
  const isHost = session?.user?.id === booking.hostId._id.toString();
  const hasToken = token && token === booking.cancelToken;

  if (!isHost && !hasToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ booking });
}

// DELETE /api/bookings/:id — cancel a booking
export async function DELETE(request, { params }) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  await connectDB();

  const booking = await Booking.findById(params.id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  // Authorise: must be either the host (JWT session) or have the cancel token
  const session = await auth();
  const isHost = session?.user?.id === booking.hostId.toString();
  const hasToken = token && token === booking.cancelToken;

  if (!isHost && !hasToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (booking.status === "cancelled") {
    return NextResponse.json({ error: "Booking already cancelled" }, { status: 400 });
  }

  // Mark as cancelled
  booking.status = "cancelled";
  await booking.save();

  // Fetch related docs for cleanup
  const host = await User.findById(booking.hostId);
  const eventType = await EventType.findById(booking.eventTypeId);

  // Delete from Google Calendar (non-blocking)
  if (host?.googleAccessToken && booking.hostGoogleEventId) {
    deleteCalendarEvent({
      accessToken: host.googleAccessToken,
      refreshToken: host.googleRefreshToken,
      eventId: booking.hostGoogleEventId,
    }).catch(console.error);
  }

  // Send cancellation emails (non-blocking)
  if (host && eventType) {
    sendCancellationEmail({ booking, eventType, host }).catch(console.error);
  }

  return NextResponse.json({ success: true });
}
