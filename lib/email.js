/**
 * lib/email.js
 * Nodemailer-based email sending for booking confirmations and cancellations.
 * Configure SMTP in .env.local (Gmail app password recommended for free tier).
 */

import nodemailer from "nodemailer";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// ── SMTP Transport ─────────────────────────────────────────────────────────
function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
}

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBookingTime(utcDate, timezone) {
  const zoned = toZonedTime(new Date(utcDate), timezone);
  return format(zoned, "EEEE, MMMM d, yyyy 'at' h:mm a zzz");
}

// ── Email Templates ────────────────────────────────────────────────────────
function bookingEmailHtml({ name, eventTitle, hostName, startTime, endTime, timezone, location, cancelUrl, appUrl }) {
  const formattedTime = formatBookingTime(startTime, timezone);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
    .card { background: white; max-width: 560px; margin: 0 auto; border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #4f46e5; padding: 32px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: #c7d2fe; margin: 8px 0 0; font-size: 14px; }
    .body { padding: 32px; }
    .detail-row { display: flex; gap: 12px; margin: 16px 0; align-items: flex-start; }
    .label { color: #6b7280; font-size: 13px; min-width: 80px; padding-top: 2px; }
    .value { color: #111827; font-size: 14px; font-weight: 500; }
    .divider { height: 1px; background: #f3f4f6; margin: 24px 0; }
    .btn { display: inline-block; background: #ef4444; color: white; text-decoration: none;
           padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; margin-top: 8px; }
    .footer { padding: 20px 32px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>✅ Meeting Confirmed</h1>
      <p>Your appointment has been scheduled</p>
    </div>
    <div class="body">
      <p style="color:#374151;margin:0 0 24px">Hi ${name},</p>
      <p style="color:#374151;margin:0 0 24px">
        Your <strong>${eventTitle}</strong> with <strong>${hostName}</strong> is confirmed.
      </p>
      
      <div class="detail-row">
        <span class="label">📅 When</span>
        <span class="value">${formattedTime}</span>
      </div>
      <div class="detail-row">
        <span class="label">📍 Where</span>
        <span class="value">${location || "Details will be shared by host"}</span>
      </div>

      <div class="divider"></div>
      <p style="color:#6b7280;font-size:13px;margin:0 0 12px">Need to cancel?</p>
      <a href="${cancelUrl}" class="btn">Cancel Meeting</a>
    </div>
    <div class="footer">
      Powered by <a href="${appUrl}" style="color:#4f46e5;">Schedulo</a> · The smart scheduling platform
    </div>
  </div>
</body>
</html>`;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Send booking confirmation to both host and invitee.
 */
export async function sendBookingConfirmation({ booking, eventType, host }) {
  // Skip if email is not configured
  if (!process.env.EMAIL_SERVER_USER) {
    console.log("📧 Email not configured — skipping confirmation email");
    return;
  }

  const transporter = getTransporter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const cancelUrl = `${appUrl}/book/${booking._id}/cancel?token=${booking.cancelToken}`;

  const commonData = {
    eventTitle: eventType.title,
    hostName: host.name,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location,
    cancelUrl,
    appUrl,
  };

  // Email to invitee
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.inviteeEmail,
    subject: `Confirmed: ${eventType.title} with ${host.name}`,
    html: bookingEmailHtml({
      ...commonData,
      name: booking.inviteeName,
      timezone: booking.inviteeTimezone,
    }),
  });

  // Email to host
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: host.email,
    subject: `New booking: ${eventType.title} with ${booking.inviteeName}`,
    html: bookingEmailHtml({
      ...commonData,
      name: host.name,
      timezone: host.timezone || "UTC",
    }),
  });
}

/**
 * Send cancellation notification.
 */
export async function sendCancellationEmail({ booking, eventType, host }) {
  if (!process.env.EMAIL_SERVER_USER) return;

  const transporter = getTransporter();
  const formattedTime = formatBookingTime(booking.startTime, booking.inviteeTimezone);

  const html = `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
      <h2 style="color:#ef4444">Meeting Cancelled</h2>
      <p>Your <strong>${eventType.title}</strong> on <strong>${formattedTime}</strong> has been cancelled.</p>
      <p style="color:#6b7280">If you'd like to reschedule, visit the booking page again.</p>
    </div>`;

  await Promise.all([
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: booking.inviteeEmail,
      subject: `Cancelled: ${eventType.title} with ${host.name}`,
      html,
    }),
    transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: host.email,
      subject: `Booking cancelled: ${eventType.title} with ${booking.inviteeName}`,
      html,
    }),
  ]);
}
