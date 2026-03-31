/**
 * app/api/availability/route.js
 * GET — fetch the current user's availability schedule
 * PUT — update availability schedule
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Availability from "@/models/Availability";

// GET /api/availability
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  // Upsert: create default availability if it doesn't exist yet
  const availability = await Availability.findOneAndUpdate(
    { userId: session.user.id },
    { $setOnInsert: { userId: session.user.id } },
    { upsert: true, new: true }
  );

  return NextResponse.json({ availability });
}

// PUT /api/availability
export async function PUT(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { schedule, dateOverrides } = body;

  await connectDB();

  const availability = await Availability.findOneAndUpdate(
    { userId: session.user.id },
    {
      $set: {
        ...(schedule && { schedule }),
        ...(dateOverrides !== undefined && { dateOverrides }),
      },
    },
    { upsert: true, new: true }
  );

  return NextResponse.json({ availability });
}
