/**
 * app/(dashboard)/dashboard/page.js
 * Main dashboard — upcoming bookings, stats, quick actions.
 */

import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import EventType from "@/models/EventType";
import User from "@/models/User";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Users,
  Plus,
  ExternalLink,
  Copy,
} from "lucide-react";
import CopyLinkButton from "@/components/dashboard/CopyLinkButton";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  await connectDB();

  const user = await User.findById(session.user.id);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const profileUrl = `${appUrl}/${user?.username}`;

  // Stats
  const [totalBookings, upcomingCount, eventTypeCount] = await Promise.all([
    Booking.countDocuments({ hostId: session.user.id }),
    Booking.countDocuments({
      hostId: session.user.id,
      status: "confirmed",
      startTime: { $gte: new Date() },
    }),
    EventType.countDocuments({ userId: session.user.id, isActive: true }),
  ]);

  // Upcoming bookings (next 5)
  const upcomingBookings = await Booking.find({
    hostId: session.user.id,
    status: "confirmed",
    startTime: { $gte: new Date() },
  })
    .populate("eventTypeId", "title color duration")
    .sort({ startTime: 1 })
    .limit(5)
    .lean();

  const userTimezone = user?.timezone || "UTC";

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4 lg:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's what's happening with your schedule.
          </p>
        </div>
        <CopyLinkButton url={profileUrl} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="Upcoming meetings" value={upcomingCount} color="bg-blue-50 text-blue-600" />
        <StatCard icon={Clock} label="Total bookings" value={totalBookings} color="bg-green-50 text-green-600" />
        <StatCard icon={Users} label="Event types" value={eventTypeCount} color="bg-purple-50 text-purple-600" />
      </div>

      {/* Upcoming bookings list */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-900">Upcoming meetings</h2>
          <Link href="/dashboard/bookings" className="text-sm text-primary-600 hover:underline">
            View all →
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No upcoming meetings</p>
            <p className="text-gray-400 text-sm mt-1">
              Share your booking link to start getting scheduled.
            </p>
            <Link href="/event-types" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create event type
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {upcomingBookings.map((booking) => {
              const zonedStart = toZonedTime(new Date(booking.startTime), userTimezone);
              return (
                <div key={booking._id} className="py-4 flex items-center gap-4">
                  {/* Color dot */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: booking.eventTypeId?.color || "#4f46e5" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {booking.eventTypeId?.title} with{" "}
                      <span className="text-primary-600">{booking.inviteeName}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(zonedStart, "EEEE, MMM d 'at' h:mm a")}
                      {" · "}
                      {booking.eventTypeId?.duration} min
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                    Confirmed
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/event-types/new" className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors group">
            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <Plus className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New event type</p>
              <p className="text-xs text-gray-400">Create a new meeting type</p>
            </div>
          </Link>
          <Link href={profileUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-colors group">
            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
              <ExternalLink className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View your booking page</p>
              <p className="text-xs text-gray-400">See what invitees see</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}
