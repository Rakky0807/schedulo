/**
 * lib/googleCalendar.js
 * Google Calendar API integration.
 * Creates/deletes events and checks for busy times.
 */

import { google } from "googleapis";

/**
 * Build an authenticated Google Calendar client for a user.
 */
function getCalendarClient(accessToken, refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  // Auto-refresh tokens
  oauth2Client.on("tokens", async (tokens) => {
    if (tokens.refresh_token) {
      // In production, persist the new refresh token to the user document
      console.log("Google token refreshed");
    }
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Create a Google Calendar event for a confirmed booking.
 *
 * @returns {string} Google Calendar event ID
 */
export async function createCalendarEvent({
  accessToken,
  refreshToken,
  booking,
  eventType,
  attendeeEmail,
  attendeeName,
  hostName,
}) {
  if (!accessToken) return null;

  try {
    const calendar = getCalendarClient(accessToken, refreshToken);

    const event = await calendar.events.insert({
      calendarId: "primary",
      sendUpdates: "all", // Google sends its own invite emails
      requestBody: {
        summary: `${eventType.title} — ${attendeeName}`,
        description: `
Scheduled via Schedulo

Meeting: ${eventType.title}
Duration: ${eventType.duration} minutes
${booking.notes ? `Notes: ${booking.notes}` : ""}
        `.trim(),
        start: {
          dateTime: new Date(booking.startTime).toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(booking.endTime).toISOString(),
          timeZone: "UTC",
        },
        attendees: [
          { email: attendeeEmail, displayName: attendeeName },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 }, // 1 day before
            { method: "popup", minutes: 30 },      // 30 min before
          ],
        },
        // Auto-create Google Meet link
        ...(eventType.locationType === "google_meet" && {
          conferenceData: {
            createRequest: {
              conferenceSolutionKey: { type: "hangoutsMeet" },
              requestId: booking._id?.toString() || Math.random().toString(36),
            },
          },
        }),
      },
      conferenceDataVersion: eventType.locationType === "google_meet" ? 1 : 0,
    });

    return event.data.id;
  } catch (error) {
    console.error("Google Calendar event creation failed:", error.message);
    return null;
  }
}

/**
 * Delete a Google Calendar event (on cancellation).
 */
export async function deleteCalendarEvent({ accessToken, refreshToken, eventId }) {
  if (!accessToken || !eventId) return;

  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all",
    });
  } catch (error) {
    console.error("Google Calendar event deletion failed:", error.message);
  }
}

/**
 * Query busy times from Google Calendar for a date range.
 * Used to block out already-booked time in external calendars.
 *
 * @returns {Array<{ start: string, end: string }>}
 */
export async function getBusyTimes({ accessToken, refreshToken, timeMin, timeMax }) {
  if (!accessToken) return [];

  try {
    const calendar = getCalendarClient(accessToken, refreshToken);

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(timeMin).toISOString(),
        timeMax: new Date(timeMax).toISOString(),
        items: [{ id: "primary" }],
      },
    });

    return response.data.calendars?.primary?.busy || [];
  } catch (error) {
    console.error("Google Calendar freebusy query failed:", error.message);
    return [];
  }
}
