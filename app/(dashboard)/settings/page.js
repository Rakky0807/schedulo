"use client";
/**
 * app/(dashboard)/settings/page.js
 * Profile settings: name, username, bio, timezone, and Google Calendar connection.
 */

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Save, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { COMMON_TIMEZONES } from "@/lib/utils";
import Image from "next/image";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [form, setForm] = useState({ name: "", username: "", bio: "", timezone: "UTC" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then(({ user }) => {
        setForm({
          name: user.name || "",
          username: user.username || "",
          bio: user.bio || "",
          timezone: user.timezone || "UTC",
        });
        setCalendarConnected(!!user.calendarConnected || !!user.googleRefreshToken);
        setLoading(false);
      });
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to save");
      return;
    }

    await update({ name: form.name });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleConnectCalendar = () => {
    // Re-trigger Google OAuth with Calendar scope
    window.location.href = "/api/auth/signin/google?callbackUrl=/settings";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your profile and integrations.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Profile */}
      <form onSubmit={handleSave} className="space-y-5">
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Profile</h2>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={56}
                height={56}
                className="rounded-full"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center text-white text-xl font-bold">
                {form.name[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
              <p className="text-xs text-gray-400">{session?.user?.email}</p>
            </div>
          </div>

          <div>
            <label className="label">Full name</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Username</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500 whitespace-nowrap">
                {new URL(appUrl).hostname}/
              </span>
              <input
                type="text"
                className="input rounded-l-none"
                value={form.username}
                onChange={(e) => set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                pattern="[a-z0-9_-]{3,30}"
                title="3–30 characters, lowercase letters, numbers, hyphens, underscores"
                required
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Your public booking page URL. 3–30 chars, lowercase only.
            </p>
          </div>

          <div>
            <label className="label">Bio <span className="text-gray-400">(optional)</span></label>
            <textarea
              className="input"
              rows={3}
              placeholder="Tell invitees a bit about yourself…"
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={300}
            />
            <p className="text-xs text-gray-400 mt-1">{form.bio.length}/300</p>
          </div>

          <div>
            <label className="label">Timezone</label>
            <select
              className="input"
              value={form.timezone}
              onChange={(e) => set("timezone", e.target.value)}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Calendar integration */}
      <section className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Calendar Integration</h2>
        <p className="text-sm text-gray-500 mb-5">
          Connect Google Calendar to sync bookings and block busy times automatically.
        </p>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
              <GoogleCalIcon />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Google Calendar</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {calendarConnected ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-xs text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs text-amber-600">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectCalendar}
            className={calendarConnected ? "btn-secondary text-sm" : "btn-primary text-sm"}
          >
            <Calendar className="w-4 h-4" />
            {calendarConnected ? "Reconnect" : "Connect"}
          </button>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Connecting Google Calendar allows Schedulo to check your availability and automatically
          add new bookings to your calendar. You can revoke access at any time from your
          Google Account settings.
        </p>
      </section>
    </div>
  );
}

function GoogleCalIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="#dadce0" strokeWidth="1.5" />
      <rect x="3" y="8" width="18" height="1.5" fill="#4285F4" />
      <text x="12" y="18" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1a73e8">
        CAL
      </text>
    </svg>
  );
}
