/**
 * app/[username]/page.js
 * Public profile page — shows all active event types for a user.
 * URL: /janedoe
 */

import { connectDB } from "@/lib/db";
import User from "@/models/User";
import EventType from "@/models/EventType";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Globe, Calendar } from "lucide-react";
import Image from "next/image";

export async function generateMetadata({ params }) {
  await connectDB();
  const user = await User.findOne({ username: params.username });
  if (!user) return { title: "Not Found" };
  return {
    title: `Book time with ${user.name}`,
    description: user.bio || `Schedule a meeting with ${user.name} using Schedulo.`,
  };
}

export default async function PublicProfilePage({ params }) {
  await connectDB();

  const user = await User.findOne({ username: params.username }).lean();
  if (!user) notFound();

  const eventTypes = await EventType.find({
    userId: user._id,
    isActive: true,
  })
    .sort({ createdAt: 1 })
    .lean();

  const locationLabels = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    phone: "Phone call",
    in_person: "In person",
    custom: "Custom",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Profile header */}
        <div className="text-center mb-10">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={72}
              height={72}
              className="rounded-full mx-auto mb-4 border-2 border-white shadow-md"
            />
          ) : (
            <div
              className="w-18 h-18 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-md"
              style={{
                width: 72,
                height: 72,
                backgroundColor: user.avatarColor || "#4f46e5",
              }}
            >
              {user.name?.[0]?.toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          {user.bio && (
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              {user.bio}
            </p>
          )}
          {user.welcomeMessage && (
            <p className="text-gray-600 text-sm mt-3 italic">"{user.welcomeMessage}"</p>
          )}
        </div>

        {/* Event type cards */}
        {eventTypes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No event types available yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eventTypes.map((et) => (
              <Link
                key={et._id.toString()}
                href={`/${params.username}/${et.slug}`}
                className="block card p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-3 h-12 rounded-full shrink-0"
                    style={{ backgroundColor: et.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {et.title}
                    </h2>
                    {et.description && (
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{et.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {et.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {locationLabels[et.locationType] || "Custom"}
                      </span>
                    </div>
                  </div>
                  <div className="text-primary-600 group-hover:translate-x-1 transition-transform text-lg">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 text-center">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Powered by <span className="font-semibold">Schedulo</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
