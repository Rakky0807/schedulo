/**
 * app/book/[bookingId]/confirmation/page.js
 * Post-booking confirmation page (also reachable via email links).
 */

import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import EventType from "@/models/EventType";
import User from "@/models/User";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import { Calendar, Clock, MapPin, CheckCircle } from "lucide-react";

export default async function ConfirmationPage({ params, searchParams }) {
  await connectDB();

  const booking = await Booking.findById(params.bookingId).lean();
  if (!booking) notFound();

  const [eventType, host] = await Promise.all([
    EventType.findById(booking.eventTypeId).lean(),
    User.findById(booking.hostId).lean(),
  ]);

  const tz = booking.inviteeTimezone || "UTC";
  const zonedStart = toZonedTime(new Date(booking.startTime), tz);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Success card */}
        <div className="card p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">You're scheduled!</h1>
          <p className="text-gray-500 text-sm">
            A calendar invite and confirmation email have been sent to{" "}
            <strong>{booking.inviteeEmail}</strong>.
          </p>
        </div>

        {/* Meeting details */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Meeting details
          </h2>

          <div className="space-y-3 text-sm">
            <DetailRow icon={Calendar} label="Event">
              {eventType?.title}
            </DetailRow>
            <DetailRow icon={Clock} label="Date & time">
              {format(zonedStart, "EEEE, MMMM d, yyyy")}
              <br />
              <span className="text-gray-500">
                {format(zonedStart, "h:mm a")} ({tz})
              </span>
            </DetailRow>
            <DetailRow icon={MapPin} label="Location">
              {booking.location || "Details in your email"}
            </DetailRow>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href={`/book/${params.bookingId}/cancel?token=${searchParams?.token || ""}`}
            className="btn-secondary flex-1 text-sm"
          >
            Cancel meeting
          </Link>
          <Link href={`/${host?.username}`} className="btn-primary flex-1 text-sm">
            ← Back to profile
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400">
          Powered by{" "}
          <Link href="/" className="font-semibold hover:text-gray-600">
            Schedulo
          </Link>
        </p>
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-gray-700">{children}</div>
      </div>
    </div>
  );
}
