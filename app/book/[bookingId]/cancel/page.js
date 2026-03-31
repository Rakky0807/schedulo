"use client";
/**
 * app/book/[bookingId]/cancel/page.js
 * Allows an invitee or host to cancel a booking using a secure token.
 */

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CancelBookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/bookings/${params.bookingId}?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setBooking(data.booking);
          setEventType(data.booking.eventTypeId);
        }
        setLoading(false);
      });
  }, [params.bookingId, token]);

  const handleCancel = async () => {
    setCancelling(true);
    const res = await fetch(`/api/bookings/${params.bookingId}?token=${token}`, {
      method: "DELETE",
    });

    const data = await res.json();
    setCancelling(false);

    if (!res.ok) {
      setError(data.error || "Failed to cancel. Please try again.");
      return;
    }

    setCancelled(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Unable to cancel</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/" className="btn-secondary">Go home</Link>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 max-w-md w-full text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Meeting cancelled</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your cancellation has been confirmed. Both parties have been notified by email.
          </p>
          <Link href="/" className="btn-primary">Back to Schedulo</Link>
        </div>
      </div>
    );
  }

  const tz = booking.inviteeTimezone || "UTC";
  const zonedStart = toZonedTime(new Date(booking.startTime), tz);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="card p-8 max-w-md w-full text-center shadow-lg">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Cancel this meeting?</h1>
        <p className="text-gray-500 text-sm mb-6">
          This will permanently cancel the meeting and notify all participants.
        </p>

        {/* Meeting details */}
        <div className="bg-gray-50 rounded-xl p-4 text-left mb-6 space-y-2">
          <p className="text-sm font-semibold text-gray-800">
            {typeof eventType === "object" ? eventType.title : eventType}
          </p>
          <p className="text-sm text-gray-500">
            {format(zonedStart, "EEEE, MMMM d, yyyy 'at' h:mm a")}
          </p>
          <p className="text-xs text-gray-400">{tz}</p>
        </div>

        <div className="flex gap-3">
          <Link href="/" className="btn-secondary flex-1">
            Keep it
          </Link>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger flex-1"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {cancelling ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
