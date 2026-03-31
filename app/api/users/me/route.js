/**
 * app/api/users/me/route.js
 * GET   — get current user profile
 * PUT   — update profile (name, timezone, bio, welcomeMessage)
 * POST  — public registration endpoint
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// GET /api/users/me
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("-password -googleAccessToken -googleRefreshToken");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({ user });
}

// PUT /api/users/me — update profile
export async function PUT(request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, timezone, bio, welcomeMessage, username } = body;

  await connectDB();

  // Ensure new username is unique if being changed
  if (username) {
    const conflict = await User.findOne({
      username,
      _id: { $ne: session.user.id },
    });
    if (conflict) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }
  }

  const updated = await User.findByIdAndUpdate(
    session.user.id,
    {
      $set: {
        ...(name && { name }),
        ...(timezone && { timezone }),
        ...(bio !== undefined && { bio }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(username && { username }),
      },
    },
    { new: true, runValidators: true }
  ).select("-password -googleAccessToken -googleRefreshToken");

  return NextResponse.json({ user: updated });
}

// POST /api/users/me (register) — public
export async function POST(request) {
  const body = await request.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  // Derive a unique username
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
  let username = base;
  let counter = 1;
  while (await User.findOne({ username })) {
    username = `${base}${counter++}`;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    username,
  });

  return NextResponse.json(
    { message: "Account created successfully", username: user.username },
    { status: 201 }
  );
}
