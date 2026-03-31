/**
 * app/(dashboard)/event-types/page.js
 * List all event types with edit/copy/delete actions.
 */

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import EventType from "@/models/EventType";
import User from "@/models/User";
import Link from "next/link";
import { Plus } from "lucide-react";
import EventTypeCard from "@/components/dashboard/EventTypeCard";

export const metadata = { title: "Event Types" };

export default async function EventTypesPage() {
  const session = await auth();
  await connectDB();

  const [eventTypes, user] = await Promise.all([
    EventType.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean(),
    User.findById(session.user.id).lean(),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage the types of meetings people can book with you.
          </p>
        </div>
        <Link href="/event-types/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New event type
        </Link>
      </div>

      {eventTypes.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-7 h-7 text-primary-600" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-2">No event types yet</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Create your first event type to start accepting bookings. You can have
            different types for different meeting lengths or purposes.
          </p>
          <Link href="/event-types/new" className="btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Create your first event type
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {eventTypes.map((et) => (
            <EventTypeCard
              key={et._id.toString()}
              eventType={et}
              username={user.username}
              appUrl={appUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
