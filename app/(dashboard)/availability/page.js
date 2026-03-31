"use client";
/**
 * app/(dashboard)/availability/page.js
 * Weekly availability schedule editor with per-day time windows.
 */

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { DAYS_OF_WEEK, COMMON_TIMEZONES } from "@/lib/utils";

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(null);
  const [timezone, setTimezone] = useState("UTC");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch availability + user timezone
    Promise.all([
      fetch("/api/availability").then((r) => r.json()),
      fetch("/api/users/me").then((r) => r.json()),
    ]).then(([avData, userData]) => {
      if (avData.availability?.schedule) {
        setSchedule(avData.availability.schedule);
      } else {
        setSchedule(defaultSchedule());
      }
      if (userData.user?.timezone) setTimezone(userData.user.timezone);
      setLoading(false);
    });
  }, []);

  const toggleDay = (day) => {
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        isAvailable: !s[day].isAvailable,
        slots:
          !s[day].isAvailable && s[day].slots.length === 0
            ? [{ start: "09:00", end: "17:00" }]
            : s[day].slots,
      },
    }));
  };

  const addSlot = (day) => {
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: [...s[day].slots, { start: "09:00", end: "17:00" }],
      },
    }));
  };

  const removeSlot = (day, idx) => {
    setSchedule((s) => ({
      ...s,
      [day]: {
        ...s[day],
        slots: s[day].slots.filter((_, i) => i !== idx),
      },
    }));
  };

  const updateSlot = (day, idx, field, value) => {
    setSchedule((s) => {
      const slots = [...s[day].slots];
      slots[idx] = { ...slots[idx], [field]: value };
      return { ...s, [day]: { ...s[day], slots } };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    // Save availability + timezone simultaneously
    const [avRes, userRes] = await Promise.all([
      fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule }),
      }),
      fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone }),
      }),
    ]);

    setSaving(false);

    if (!avRes.ok || !userRes.ok) {
      setError("Failed to save. Please try again.");
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const timeOptions = generateTimeOptions();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
          <p className="text-gray-500 text-sm mt-1">
            Set the times you're open for bookings each week.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saved ? "Saved!" : saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Timezone selector */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <p className="font-medium text-gray-900 text-sm">Your timezone</p>
          <p className="text-xs text-gray-400 mt-0.5">
            All times are shown and stored in this timezone.
          </p>
        </div>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="input sm:w-64"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      {/* Weekly schedule */}
      <div className="card divide-y divide-gray-100">
        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
          const dayData = schedule?.[day] || { isAvailable: false, slots: [] };
          return (
            <div key={day} className="p-5">
              <div className="flex items-center gap-4">
                {/* Toggle */}
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                    dayData.isAvailable ? "bg-primary-600" : "bg-gray-200"
                  }`}
                  aria-label={`Toggle ${DAYS_OF_WEEK[day]}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      dayData.isAvailable ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>

                {/* Day name */}
                <span
                  className={`w-24 text-sm font-medium ${
                    dayData.isAvailable ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {DAYS_OF_WEEK[day]}
                </span>

                {/* Time slots */}
                {dayData.isAvailable ? (
                  <div className="flex-1 space-y-2">
                    {dayData.slots.map((slot, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={slot.start}
                          onChange={(e) => updateSlot(day, idx, "start", e.target.value)}
                          className="input text-sm flex-1 max-w-[120px]"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="text-gray-400 text-sm">–</span>
                        <select
                          value={slot.end}
                          onChange={(e) => updateSlot(day, idx, "end", e.target.value)}
                          className="input text-sm flex-1 max-w-[120px]"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeSlot(day, idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSlot(day)}
                      className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add hours
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">Unavailable</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function defaultSchedule() {
  const defaults = { isAvailable: false, slots: [] };
  const workday = { isAvailable: true, slots: [{ start: "09:00", end: "17:00" }] };
  return { 0: defaults, 1: workday, 2: workday, 3: workday, 4: workday, 5: workday, 6: defaults };
}

function generateTimeOptions() {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
    }
  }
  return times;
}
