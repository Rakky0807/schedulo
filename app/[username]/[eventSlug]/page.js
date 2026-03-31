/**
 * app/[username]/[eventSlug]/page.js
 * Public booking page — date picker, slot selection, form, AI assistant.
 * This is the core invitee experience.
 */

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import EventType from "@/models/EventType";
import { notFound } from "next/navigation";
import BookingFlow from "@/components/booking/BookingFlow";
import { Clock, Globe, MapPin } from "lucide-react";
import Image from "next/image";

export async function generateMetadata({ params }) {
  await connectDB();
  const user = await User.findOne({ username: params.username });
  const eventType = user
    ? await EventType.findOne({ userId: user._id, slug: params.eventSlug })
    : null;
  if (!eventType) return { title: "Book a meeting" };
  return {
    title: `Book: ${eventType.title} with ${user.name}`,
    description: eventType.description || `Schedule a ${eventType.duration}-min meeting with ${user.name}`,
  };
}

export default async function BookingPage({ params }) {
  await connectDB();

  const user = await User.findOne({ username: params.username }).lean();
  if (!user) notFound();

  const eventType = await EventType.findOne({
    userId: user._id,
    slug: params.eventSlug,
    isActive: true,
  }).lean();

  if (!eventType) notFound();

  const locationLabels = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    phone: "Phone call",
    in_person: "In person",
    custom: eventType.locationValue || "Custom location",
  };

  // Serialise Mongoose docs to plain objects for client components
  const hostData = {
    name: user.name,
    username: user.username,
    image: user.image || null,
    bio: user.bio || "",
    timezone: user.timezone || "UTC",
    avatarColor: user.avatarColor || "#4f46e5",
  };

  const eventTypeData = {
    id: eventType._id.toString(),
    title: eventType.title,
    description: eventType.description,
    duration: eventType.duration,
    color: eventType.color,
    slug: eventType.slug,
    locationType: eventType.locationType,
    locationValue: eventType.locationValue,
    locationLabel: locationLabels[eventType.locationType] || "Custom",
    bookingWindow: eventType.bookingWindow || 60,
    questions: eventType.questions || [],
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card overflow-hidden shadow-lg">
          <div className="flex flex-col md:flex-row">
            {/* ── Left panel — meeting info ───────────────────────── */}
            <div className="md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-6 md:p-8 flex-shrink-0">
              {/* Host avatar */}
              {hostData.image ? (
                <Image
                  src={hostData.image}
                  alt={hostData.name}
                  width={52}
                  height={52}
                  className="rounded-full mb-4 border border-gray-100"
                />
              ) : (
                <div
                  className="w-13 h-13 rounded-full mb-4 flex items-center justify-center text-white text-xl font-bold"
                  style={{ width: 52, height: 52, backgroundColor: hostData.avatarColor }}
                >
                  {hostData.name?.[0]?.toUpperCase()}
                </div>
              )}

              <p className="text-sm text-gray-500 font-medium">{hostData.name}</p>
              <h1
                className="text-xl font-bold mt-1 mb-4"
                style={{ color: eventTypeData.color }}
              >
                {eventTypeData.title}
              </h1>

              {eventTypeData.description && (
                <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                  {eventTypeData.description}
                </p>
              )}

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{eventTypeData.duration} minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>{eventTypeData.locationLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-400">Your timezone auto-detected</span>
                </div>
              </div>
            </div>

            {/* ── Right panel — booking flow (client) ─────────────── */}
            <div className="flex-1 p-6 md:p-8">
              <BookingFlow host={hostData} eventType={eventTypeData} />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Powered by{" "}
          <a href="/" className="font-semibold hover:text-gray-600 transition-colors">
            Schedulo
          </a>
        </p>
      </div>
    </div>
  );
}
