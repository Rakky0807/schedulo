"use client";
/**
 * components/booking/BookingFlow.js
 * Multi-step booking wizard:
 *   Step 1 — Pick a date (mini calendar)
 *   Step 2 — Pick a time slot (+ AI assistant)
 *   Step 3 — Fill in details form
 *   Step 4 — Confirmation screen
 */

import { useState, useEffect, useCallback } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isBefore,
  startOfDay,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Bot, Send, Sparkles } from "lucide-react";
import { detectTimezone } from "@/lib/utils";

export default function BookingFlow({ host, eventType }) {
  const [step, setStep] = useState(1); // 1=date, 2=time, 3=form, 4=confirmed
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [timezone, setTimezone] = useState("UTC");
  const [bookingId, setBookingId] = useState(null);

  // AI assistant state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [allSlots, setAllSlots] = useState([]); // slots across next 14 days (for AI)

  useEffect(() => {
    setTimezone(detectTimezone());
  }, []);

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    fetch(
      `/api/slots?username=${host.username}&eventSlug=${eventType.slug}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`
    )
      .then((r) => r.json())
      .then(({ slots }) => {
        setSlots(slots || []);
        setSlotsLoading(false);
      });
  }, [selectedDate, timezone, host.username, eventType.slug]);

  // Pre-fetch next 14 days of slots for the AI assistant
  const fetchAiSlots = useCallback(async () => {
    const today = new Date();
    const allFetched = [];

    await Promise.all(
      Array.from({ length: 14 }, (_, i) => {
        const date = addDays(today, i + 1);
        const dateStr = format(date, "yyyy-MM-dd");
        const dateLabel = format(date, "EEE, MMM d");

        return fetch(
          `/api/slots?username=${host.username}&eventSlug=${eventType.slug}&date=${dateStr}&timezone=${encodeURIComponent(timezone)}`
        )
          .then((r) => r.json())
          .then(({ slots }) => {
            if (slots?.length) {
              slots.forEach((s) => allFetched.push({ ...s, dateLabel, dateStr }));
            }
          });
      })
    );

    setAllSlots(allFetched);
  }, [host.username, eventType.slug, timezone]);

  const handleAiSubmit = async (e) => {
    e?.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiMessage("");
    setAiSuggestions([]);

    if (allSlots.length === 0) await fetchAiSlots();

    const res = await fetch("/api/ai/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: aiQuery,
        availableSlots: allSlots,
        timezone,
      }),
    });

    const data = await res.json();
    setAiMessage(data.message);
    setAiSuggestions(data.suggestedSlots || []);
    setAiLoading(false);
  };

  const handleAiSlotPick = (slot) => {
    // Navigate calendar to that date and select the slot
    const date = new Date(slot.utcStart);
    setSelectedDate(date);
    setCalendarMonth(date);
    setSelectedSlot(slot);
    setStep(3);
    setAiSuggestions([]);
    setAiQuery("");
  };

  // Calendar helpers
  const today = startOfDay(new Date());
  const maxDate = addDays(today, eventType.bookingWindow);

  const calDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(calendarMonth)),
    end: endOfWeek(endOfMonth(calendarMonth)),
  });

  const isDayDisabled = (day) =>
    isBefore(day, today) || isBefore(maxDate, day);

  // ── Step 1 — Date picker ──────────────────────────────────────────────────
  if (step === 1 || step === 2) {
    return (
      <div className="space-y-6 animate-slide-up">
        {/* AI Assistant banner */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 border border-primary-100 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-primary-700">AI Scheduling Assistant</span>
            <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">Gemini Flash</span>
          </div>
          <form onSubmit={handleAiSubmit} className="flex gap-2">
            <input
              type="text"
              className="input flex-1 text-sm bg-white"
              placeholder='Try: "Book me something Tuesday afternoon"'
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              disabled={aiLoading}
            />
            <button
              type="submit"
              disabled={aiLoading || !aiQuery.trim()}
              className="btn-primary px-3 py-2"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
          {aiMessage && (
            <div className="mt-3">
              <p className="text-sm text-gray-700 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-500 mt-0.5 shrink-0" />
                {aiMessage}
              </p>
              {aiSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {aiSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleAiSlotPick(s)}
                      className="text-xs bg-white border border-primary-300 text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                    >
                      {s.dateLabel} · {s.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Mini calendar */}
          <div className="sm:w-72 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                {format(calendarMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-2">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {calDays.map((day, i) => {
                const isCurrentMonth =
                  day.getMonth() === calendarMonth.getMonth();
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                const disabled = isDayDisabled(day);

                return (
                  <button
                    key={i}
                    onClick={() => {
                      if (disabled) return;
                      setSelectedDate(day);
                      setSelectedSlot(null);
                      setStep(2);
                    }}
                    disabled={disabled}
                    className={`
                      aspect-square flex items-center justify-center rounded-lg text-sm transition-all
                      ${!isCurrentMonth ? "text-gray-300" : ""}
                      ${disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-primary-50 cursor-pointer"}
                      ${isSelected ? "bg-primary-600 text-white hover:bg-primary-700 font-bold" : ""}
                      ${isToday && !isSelected ? "border-2 border-primary-400 font-bold text-primary-600" : ""}
                      ${!isSelected && !isToday && isCurrentMonth && !disabled ? "text-gray-700" : ""}
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Times shown in <span className="font-medium">{timezone}</span>
            </p>
          </div>

          {/* Time slots */}
          {step === 2 && selectedDate && (
            <div className="flex-1 animate-slide-up">
              <h2 className="font-semibold text-gray-900 mb-3">
                {format(selectedDate, "EEEE, MMMM d")}
              </h2>

              {slotsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                </div>
              ) : slots.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">No available slots on this day.</p>
                  <p className="text-xs mt-1">Try another date or use the AI assistant above.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                  {slots.map((slot, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep(3);
                      }}
                      className="py-2.5 px-4 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all text-center"
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step 3 — Booking form ─────────────────────────────────────────────────
  if (step === 3) {
    return (
      <BookingForm
        host={host}
        eventType={eventType}
        selectedDate={selectedDate}
        selectedSlot={selectedSlot}
        timezone={timezone}
        onBack={() => setStep(2)}
        onSuccess={(id) => {
          setBookingId(id);
          setStep(4);
        }}
      />
    );
  }

  // ── Step 4 — Confirmed ────────────────────────────────────────────────────
  if (step === 4) {
    return <ConfirmationScreen selectedSlot={selectedSlot} timezone={timezone} host={host} eventType={eventType} bookingId={bookingId} />;
  }
}

// ── Booking Form ────────────────────────────────────────────────────────────
function BookingForm({ host, eventType, selectedDate, selectedSlot, timezone, onBack, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", notes: "" });
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: host.username,
        eventSlug: eventType.slug,
        utcStart: selectedSlot.utcStart,
        utcEnd: selectedSlot.utcEnd,
        inviteeName: form.name,
        inviteeEmail: form.email,
        inviteeTimezone: timezone,
        notes: form.notes,
        answers: Object.entries(answers).map(([label, answer]) => ({ questionLabel: label, answer })),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Failed to book. Please try again.");
      return;
    }

    onSuccess(data.bookingId);
  };

  return (
    <div className="animate-slide-up space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="font-semibold text-gray-900">Your details</h2>
          <p className="text-sm text-gray-400">
            {format(selectedDate, "EEEE, MMM d")} · {selectedSlot.display} · {eventType.duration} min
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Your name *</label>
          <input
            type="text"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="label">Email address *</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="jane@example.com"
          />
        </div>

        {/* Custom questions */}
        {eventType.questions?.map((q, i) => (
          <div key={i}>
            <label className="label">
              {q.label} {q.required && <span className="text-red-500">*</span>}
            </label>
            {q.type === "textarea" ? (
              <textarea
                className="input"
                rows={3}
                required={q.required}
                value={answers[q.label] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
              />
            ) : (
              <input
                type="text"
                className="input"
                required={q.required}
                value={answers[q.label] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.label]: e.target.value })}
              />
            )}
          </div>
        ))}

        <div>
          <label className="label">Additional notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            className="input"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Anything the host should know…"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {submitting ? "Booking…" : "Confirm booking"}
        </button>
      </form>
    </div>
  );
}

// ── Confirmation Screen ─────────────────────────────────────────────────────
function ConfirmationScreen({ selectedSlot, timezone, host, eventType }) {
  return (
    <div className="text-center py-8 animate-slide-up space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">✅</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900">You're scheduled!</h2>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        A confirmation email has been sent to you. You'll find the calendar invite in your inbox.
      </p>
      <div className="bg-gray-50 rounded-xl p-4 text-left max-w-xs mx-auto space-y-2 mt-4">
        <p className="text-sm font-semibold text-gray-700">{eventType.title}</p>
        <p className="text-sm text-gray-500">
          with <span className="font-medium">{host.name}</span>
        </p>
        <p className="text-sm text-gray-500">
          {selectedSlot?.dateLabel} · {selectedSlot?.display}
        </p>
        <p className="text-xs text-gray-400">{timezone}</p>
      </div>
      <a href={`/${host.username}`} className="btn-secondary inline-flex mt-4">
        ← Back to {host.name}'s page
      </a>
    </div>
  );
}
