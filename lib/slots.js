/**
 * lib/slots.js
 * Core scheduling algorithm:
 *  1. Reads user's weekly availability for a given date
 *  2. Generates all possible time slots based on event duration + buffer
 *  3. Removes slots that overlap with existing bookings
 *  4. Removes slots in the past (with advance-notice buffer)
 *  5. Returns available slots in the requested timezone
 */

import {
  parseISO,
  addMinutes,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  startOfDay,
  format,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Generate available time slots for a given date.
 *
 * @param {Object} params
 * @param {string} params.dateStr        - "YYYY-MM-DD" in the HOST's timezone
 * @param {Object} params.availability   - Availability document from DB
 * @param {number} params.duration       - Event duration in minutes
 * @param {number} params.bufferBefore   - Buffer before each slot (minutes)
 * @param {number} params.bufferAfter    - Buffer after each slot (minutes)
 * @param {number} params.advanceNotice  - Min hours before booking is allowed
 * @param {Array}  params.existingBookings - Array of { startTime, endTime } (UTC Dates)
 * @param {string} params.hostTimezone   - Host's IANA timezone (e.g. "America/New_York")
 * @param {string} params.inviteeTimezone - Invitee's timezone (for display)
 * @returns {Array<{ start: string, end: string, utcStart: string, utcEnd: string }>}
 */
export function generateSlots({
  dateStr,
  availability,
  duration,
  bufferBefore = 0,
  bufferAfter = 0,
  advanceNotice = 1,
  existingBookings = [],
  hostTimezone = "UTC",
  inviteeTimezone = "UTC",
}) {
  const slots = [];
  const dayOfWeek = getDayOfWeek(dateStr, hostTimezone);

  // Check for date override first, fall back to weekly schedule
  const override = availability.dateOverrides?.find(
    (o) => o.date === dateStr
  );
  const daySchedule = override ?? availability.schedule?.[dayOfWeek];

  if (!daySchedule?.isAvailable || !daySchedule.slots?.length) return [];

  const minimumStart = addMinutes(new Date(), advanceNotice * 60);

  for (const window of daySchedule.slots) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);

    // Build window boundaries in host's timezone, converted to UTC
    const windowStart = fromZonedTime(
      setMinutes(setHours(parseISO(dateStr), startH), startM),
      hostTimezone
    );
    const windowEnd = fromZonedTime(
      setMinutes(setHours(parseISO(dateStr), endH), endM),
      hostTimezone
    );

    let cursor = windowStart;
    const slotBlock = duration + bufferBefore + bufferAfter;

    while (isBefore(addMinutes(cursor, duration), windowEnd) ||
           +addMinutes(cursor, duration) === +windowEnd) {
      const slotStart = addMinutes(cursor, bufferBefore);
      const slotEnd = addMinutes(slotStart, duration);

      if (isAfter(slotStart, minimumStart) && !isOverlapping(slotStart, slotEnd, existingBookings)) {
        // Display times in invitee's timezone
        const inviteeStart = toZonedTime(slotStart, inviteeTimezone);
        const inviteeEnd = toZonedTime(slotEnd, inviteeTimezone);

        slots.push({
          start: format(inviteeStart, "HH:mm"),
          end: format(inviteeEnd, "HH:mm"),
          utcStart: slotStart.toISOString(),
          utcEnd: slotEnd.toISOString(),
          display: format(inviteeStart, "h:mm a"),
        });
      }

      cursor = addMinutes(cursor, slotBlock || 30);
    }
  }

  return slots;
}

/**
 * Returns the day-of-week index (0=Sun…6=Sat) for a date string
 * interpreted in the host's timezone.
 */
function getDayOfWeek(dateStr, timezone) {
  const zonedDate = toZonedTime(parseISO(dateStr), timezone);
  return zonedDate.getDay();
}

/**
 * Returns true if [slotStart, slotEnd] overlaps with any existing booking.
 * Adds a 1-minute grace buffer to avoid edge-to-edge conflicts.
 */
function isOverlapping(slotStart, slotEnd, bookings) {
  return bookings.some((b) => {
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return (
      isBefore(slotStart, addMinutes(bEnd, -1)) &&
      isAfter(slotEnd, addMinutes(bStart, 1))
    );
  });
}

/**
 * Get all dates in the next N days that have at least one available slot.
 * Used to grey out fully-booked or unavailable days on the calendar.
 */
export function getAvailableDatesInRange(availability, hostTimezone, days = 60) {
  const available = [];
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = addMinutes(today, i * 24 * 60);
    const dateStr = format(toZonedTime(date, hostTimezone), "yyyy-MM-dd");
    const dayOfWeek = toZonedTime(date, hostTimezone).getDay();

    const override = availability.dateOverrides?.find((o) => o.date === dateStr);
    const daySchedule = override ?? availability.schedule?.[dayOfWeek];

    if (daySchedule?.isAvailable && daySchedule.slots?.length > 0) {
      available.push(dateStr);
    }
  }

  return available;
}
