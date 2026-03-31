/**
 * app/api/event-types/[id]/route.js
 * GET    — fetch a single event type
 * PUT    — update an event type
 * DELETE — delete an event type
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import EventType from "@/models/EventType";
import { slugify } from "@/lib/utils";

// GET /api/event-types/:id
export async function GET(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const eventType = await EventType.findOne({
    _id: params.id,
    userId: session.user.id,
  });

  if (!eventType) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ eventType });
}

// PUT /api/event-types/:id
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  await connectDB();

  const eventType = await EventType.findOne({
    _id: params.id,
    userId: session.user.id,
  });
  if (!eventType) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-slug only if title changed
  if (body.title && body.title !== eventType.title) {
    let slug = slugify(body.title);
    let attempt = 0;
    while (
      await EventType.findOne({
        userId: session.user.id,
        slug,
        _id: { $ne: params.id },
      })
    ) {
      slug = `${slugify(body.title)}-${++attempt}`;
    }
    body.slug = slug;
  }

  const updated = await EventType.findByIdAndUpdate(
    params.id,
    { $set: body },
    { new: true, runValidators: true }
  );

  return NextResponse.json({ eventType: updated });
}

// DELETE /api/event-types/:id
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const deleted = await EventType.findOneAndDelete({
    _id: params.id,
    userId: session.user.id,
  });

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
