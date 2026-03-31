/**
 * lib/gemini.js
 * Gemini 1.5 Flash integration via REST API (free tier).
 * Used for the smart scheduling assistant on booking pages.
 * Get your free API key at: aistudio.google.com
 */

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

/**
 * Parse a natural-language scheduling request and map it to available slots.
 *
 * @param {string} userMessage   - e.g. "Book me something Tuesday afternoon"
 * @param {Array}  availableSlots - Array of slot objects with { utcStart, utcEnd, display }
 * @param {string} timezone       - Invitee's IANA timezone
 * @returns {Object} { message: string, suggestedSlots: Array }
 */
export async function parseSchedulingRequest(userMessage, availableSlots, timezone) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      message: "AI assistant is not configured. Please set GEMINI_API_KEY.",
      suggestedSlots: [],
    };
  }

  // Format slots for context (limit to 50 to stay within token limits)
  const slotsContext = availableSlots
    .slice(0, 50)
    .map((s, i) => `${i}: ${s.dateLabel} at ${s.display} (${timezone})`)
    .join("\n");

  const systemPrompt = `You are a helpful scheduling assistant for a calendar booking platform called Schedulo.

The user wants to book a meeting. Based on their natural language request and the available time slots listed below, suggest the best matching slot(s).

Available slots (index: date at time):
${slotsContext || "No slots available in the requested range."}

User's timezone: ${timezone}
Current date/time: ${new Date().toISOString()}

Instructions:
1. Understand the user's request (day preference, time of day, ASAP, etc.)
2. Return a JSON response with:
   - "message": a friendly response explaining what you found
   - "slotIndices": an array of up to 3 slot indices that best match the request
   - "noMatch": true if no slots match the request

Respond ONLY with valid JSON. No markdown, no explanation outside the JSON.

Example response:
{"message": "I found a great Tuesday afternoon slot for you!", "slotIndices": [5, 6], "noMatch": false}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser request: "${userMessage}"` }],
          },
        ],
        generationConfig: {
          temperature: 0.3, // Lower temperature for more deterministic slot-matching
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return { message: "Sorry, the AI assistant is temporarily unavailable.", suggestedSlots: [] };
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Strip any accidental markdown code fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.noMatch) {
      return {
        message: parsed.message || "I couldn't find slots matching that request. Try a different time?",
        suggestedSlots: [],
      };
    }

    const suggestedSlots = (parsed.slotIndices || [])
      .filter((i) => i >= 0 && i < availableSlots.length)
      .map((i) => availableSlots[i]);

    return {
      message: parsed.message || `I found ${suggestedSlots.length} slot(s) for you!`,
      suggestedSlots,
    };
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return {
      message: "I had trouble understanding that. Try: 'Book me something Monday morning' or 'Find me a slot this week'.",
      suggestedSlots: [],
    };
  }
}

/**
 * Generate a meeting preparation summary given event details.
 * Bonus feature: helps the host prepare context before a meeting.
 */
export async function generateMeetingPrepSummary(eventType, booking) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `You are a professional meeting assistant. Generate a brief (3-4 sentence) preparation note for the following meeting:

Meeting type: ${eventType.title}
Duration: ${eventType.duration} minutes
Invitee: ${booking.inviteeName}
Notes from invitee: ${booking.notes || "None provided"}
Custom answers: ${JSON.stringify(booking.answers || [])}

Write a helpful, friendly preparation note for the meeting host. Keep it concise.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    });

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}
