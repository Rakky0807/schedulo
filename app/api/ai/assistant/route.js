/**
 * app/api/ai/assistant/route.js
 * POST — natural-language scheduling assistant powered by Gemini 1.5 Flash (free)
 *
 * Request body:
 *   message       - user's natural language input
 *   availableSlots - array of slot objects from /api/slots
 *   timezone      - invitee's timezone
 */

import { NextResponse } from "next/server";
import { parseSchedulingRequest } from "@/lib/gemini";

export async function POST(request) {
  const body = await request.json();
  const { message, availableSlots, timezone } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  if (!availableSlots?.length) {
    return NextResponse.json({
      message: "There are no available slots to choose from.",
      suggestedSlots: [],
    });
  }

  const result = await parseSchedulingRequest(message, availableSlots, timezone || "UTC");
  return NextResponse.json(result);
}
