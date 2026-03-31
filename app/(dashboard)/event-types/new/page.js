"use client";
/**
 * app/(dashboard)/event-types/new/page.js
 * Create a new event type with a multi-section form.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { DURATION_OPTIONS, EVENT_COLORS, slugify } from "@/lib/utils";

export default function NewEventTypePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: 30,
    color: "#4f46e5",
    locationType: "google_meet",
    locationValue: "",
    bufferBefore: 0,
    bufferAfter: 0,
    advanceNotice: 1,
    bookingWindow: 60,
    questions: [],
  });

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addQuestion = () => {
    set("questions", [
      ...form.questions,
      { label: "", type: "text", required: false, options: [] },
    ]);
  };

  const removeQuestion = (i) => {
    set("questions", form.questions.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i, field, value) => {
    const qs = [...form.questions];
    qs[i] = { ...qs[i], [field]: value };
    set("questions", qs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/event-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "Failed to create event type");
      return;
    }

    router.push("/event-types");
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pt-4 lg:pt-0">
      <div className="flex items-center gap-3">
        <Link href="/event-types" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Event Type</h1>
          <p className="text-gray-500 text-sm">Configure how people can book time with you.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* Basic info */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Basic info</h2>

          <div>
            <label className="label">Title *</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 30-Minute Intro Call"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
            {form.title && (
              <p className="text-xs text-gray-400 mt-1">
                URL slug: <code className="bg-gray-100 px-1 rounded">{slugify(form.title)}</code>
              </p>
            )}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input"
              rows={3}
              placeholder="A brief description shown on your booking page"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="label">Duration</label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set("duration", opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    form.duration === opt.value
                      ? "bg-primary-600 text-white border-primary-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-primary-400"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="label">Color</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => set("color", c.value)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: form.color === c.value ? "#1a1a1a" : "transparent",
                    transform: form.color === c.value ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Location</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: "google_meet", label: "Google Meet" },
              { value: "zoom", label: "Zoom" },
              { value: "phone", label: "Phone call" },
              { value: "in_person", label: "In person" },
            ].map((loc) => (
              <button
                key={loc.value}
                type="button"
                onClick={() => set("locationType", loc.value)}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  form.locationType === loc.value
                    ? "bg-primary-50 border-primary-500 text-primary-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>
          {(form.locationType === "zoom" ||
            form.locationType === "in_person" ||
            form.locationType === "phone") && (
            <div>
              <label className="label">
                {form.locationType === "in_person" ? "Address" : "Link or number"}
              </label>
              <input
                type="text"
                className="input"
                placeholder={
                  form.locationType === "in_person"
                    ? "123 Main St, City"
                    : "https://zoom.us/j/..."
                }
                value={form.locationValue}
                onChange={(e) => set("locationValue", e.target.value)}
              />
            </div>
          )}
        </section>

        {/* Scheduling settings */}
        <section className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Scheduling</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Buffer before (min)</label>
              <input
                type="number"
                min="0"
                max="60"
                step="5"
                className="input"
                value={form.bufferBefore}
                onChange={(e) => set("bufferBefore", parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Buffer after (min)</label>
              <input
                type="number"
                min="0"
                max="60"
                step="5"
                className="input"
                value={form.bufferAfter}
                onChange={(e) => set("bufferAfter", parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Min notice (hours)</label>
              <input
                type="number"
                min="0"
                max="72"
                className="input"
                value={form.advanceNotice}
                onChange={(e) => set("advanceNotice", parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Book up to (days ahead)</label>
              <input
                type="number"
                min="1"
                max="365"
                className="input"
                value={form.bookingWindow}
                onChange={(e) => set("bookingWindow", parseInt(e.target.value))}
              />
            </div>
          </div>
        </section>

        {/* Custom questions */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Intake questions</h2>
            <button type="button" onClick={addQuestion} className="btn-secondary text-xs py-1.5">
              <Plus className="w-3.5 h-3.5" /> Add question
            </button>
          </div>

          {form.questions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No questions added. Click "Add question" to collect info from invitees.
            </p>
          ) : (
            <div className="space-y-3">
              {form.questions.map((q, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      className="input text-sm"
                      placeholder="Question label"
                      value={q.label}
                      onChange={(e) => updateQuestion(i, "label", e.target.value)}
                    />
                    <div className="flex gap-2">
                      <select
                        className="input text-sm flex-1"
                        value={q.type}
                        onChange={(e) => updateQuestion(i, "type", e.target.value)}
                      >
                        <option value="text">Short text</option>
                        <option value="textarea">Long text</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-sm text-gray-600 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(i, "required", e.target.checked)}
                          className="rounded"
                        />
                        Required
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="p-2 text-red-400 hover:text-red-600 mt-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Submit */}
        <div className="flex gap-3 justify-end pb-8">
          <Link href="/event-types" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {saving ? "Creating…" : "Create event type"}
          </button>
        </div>
      </form>
    </div>
  );
}
