"use client";
/**
 * components/dashboard/EventTypeCard.js
 * Card for each event type on the management page.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Copy,
  Check,
  Pencil,
  Trash2,
  ExternalLink,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventTypeCard({ eventType, username, appUrl }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bookingUrl = `${appUrl}/${username}/${eventType.slug}`;

  const handleCopy = async (e) => {
    e.preventDefault();
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    if (!confirm(`Delete "${eventType.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/event-types/${eventType._id}`, { method: "DELETE" });
    router.refresh();
  };

  const locationLabels = {
    google_meet: "Google Meet",
    zoom: "Zoom",
    phone: "Phone call",
    in_person: "In person",
    custom: "Custom",
  };

  return (
    <div className={cn("card p-5 hover:shadow-md transition-shadow flex flex-col gap-4", !eventType.isActive && "opacity-60")}>
      {/* Color accent + title */}
      <div className="flex items-start gap-3">
        <div
          className="w-3 h-full min-h-[40px] rounded-full shrink-0"
          style={{ backgroundColor: eventType.color }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{eventType.title}</h3>
          {eventType.description && (
            <p className="text-sm text-gray-400 mt-0.5 truncate">{eventType.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {eventType.duration} min
            </span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              {locationLabels[eventType.locationType] || "Custom"}
            </span>
          </div>
        </div>
        <span
          className={cn(
            "text-xs px-2 py-1 rounded-full font-medium shrink-0",
            eventType.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          )}
        >
          {eventType.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* URL preview */}
      <div className="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-400 truncate font-mono">
        {`/${username}/${eventType.slug}`}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 btn-secondary text-xs py-2 gap-1.5"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Copy link"}
        </button>
        <Link
          href={bookingUrl}
          target="_blank"
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title="Preview"
        >
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </Link>
        <Link
          href={`/event-types/${eventType._id}/edit`}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          title="Edit"
        >
          <Pencil className="w-4 h-4 text-gray-500" />
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          title="Delete"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
}
