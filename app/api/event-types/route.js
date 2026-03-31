/**
 * app/api/event-types/route.js
 * GET  — list all event types for the authenticated user
 * POST — create a new event type
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import EventType from "@/models/EventType";
import Availability from "@/models/Availability";
import { slugify } from "@/lib/utils";

// GET /api/event-types
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const eventTypes = await EventType.find({ userId: session.user.id }).sort({ createdAt: -1 });
  return NextResponse.json({ eventTypes });
}

// POST /api/event-types
export async function POST(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    title, description, duration, color,
    bufferBefore, bufferAfter, advanceNotice,
    bookingWindow, maxPerDay, locationType,
    locationValue, questions,
  } = body;

  if (!title || !duration) {
    return NextResponse.json({ error: "Title and duration are required" }, { status: 400 });
  }

  await connectDB();

  // Generate unique slug for this user
  let slug = slugify(title);
  let attempt = 0;
  while (await EventType.findOne({ userId: session.user.id, slug })) {
    slug = `${slugify(title)}-${++attempt}`;
  }

  const eventType = await EventType.create({
    userId: session.user.id,
    title: title.trim(),
    slug,
    description: description || "",
    duration: parseInt(duration),
    color: color || "#4f46e5",
    bufferBefore: bufferBefore || 0,
    bufferAfter: bufferAfter || 0,
    advanceNotice: advanceNotice || 1,
    bookingWindow: bookingWindow || 60,
    maxPerDay: maxPerDay || 0,
    locationType: locationType || "google_meet",
    locationValue: locationValue || "",
    questions: questions || [],
  });

  // Ensure the user has an availability record
  await Availability.findOneAndUpdate(
    { userId: session.user.id },
    { $setOnInsert: { userId: session.user.id } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ eventType }, { status: 201 });
}
