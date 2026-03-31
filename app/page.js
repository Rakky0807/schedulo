/**
 * app/page.js
 * Marketing landing page — hero, features, and CTA.
 */

import Link from "next/link";
import { Calendar, Clock, Users, Zap, Globe, Bot } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Schedulo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 px-4 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-primary-100">
          <Bot className="w-3.5 h-3.5" />
          AI-powered scheduling assistant included
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight max-w-3xl mx-auto">
          Scheduling that works
          <span className="text-primary-600"> for everyone</span>
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
          Share your availability, let others book time with you. No more
          back-and-forth emails — ever again.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Start for free →
          </Link>
          <Link href="/demo/30min" className="btn-secondary text-base px-8 py-3">
            See a live booking page
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          No credit card required · Google Calendar sync included
        </p>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Everything you need to schedule smarter
          </h2>
          <p className="text-center text-gray-500 mb-14 max-w-xl mx-auto">
            Built for professionals, consultants, and teams who value their time.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card p-6 hover:shadow-md transition-shadow">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.iconBg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.iconColor }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ─────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-14">
            Up and running in minutes
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-primary-600 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to reclaim your time?
          </h2>
          <p className="text-primary-100 mb-8 text-lg">
            Join thousands of professionals who schedule smarter with Schedulo.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors text-base">
            Get started free →
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-8 border-t border-gray-100 text-center text-gray-400 text-sm">
        <p>© 2025 Schedulo. Built with Next.js, MongoDB & Gemini AI.</p>
      </footer>
    </div>
  );
}

const features = [
  {
    title: "Google Calendar Sync",
    desc: "Connect your Google Calendar and bookings automatically appear — real-time, two-way sync.",
    icon: Calendar,
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
  },
  {
    title: "Custom Event Types",
    desc: "Create 15-min calls, 1-hour consultations, or anything in between with custom questions.",
    icon: Clock,
    iconBg: "#f0fdf4",
    iconColor: "#22c55e",
  },
  {
    title: "Global Timezone Support",
    desc: "Auto-detects your invitee's timezone. Everyone always sees the right local time.",
    icon: Globe,
    iconBg: "#fdf4ff",
    iconColor: "#a855f7",
  },
  {
    title: "AI Scheduling Assistant",
    desc: 'Invitees can type "Book me something Tuesday afternoon" and our AI finds the perfect slot.',
    icon: Bot,
    iconBg: "#fff7ed",
    iconColor: "#f97316",
  },
  {
    title: "Team Booking Pages",
    desc: "Your unique link works for unlimited event types. Share it anywhere — bio, email, website.",
    icon: Users,
    iconBg: "#fff1f2",
    iconColor: "#f43f5e",
  },
  {
    title: "Instant Confirmations",
    desc: "Both you and your invitee get beautiful email confirmations with cancel links included.",
    icon: Zap,
    iconBg: "#fefce8",
    iconColor: "#eab308",
  },
];

const steps = [
  {
    title: "Create your account",
    desc: "Sign up in 30 seconds with Google or email. Your booking page is ready instantly.",
  },
  {
    title: "Set your availability",
    desc: "Tell us when you're free. Connect Google Calendar to block busy times automatically.",
  },
  {
    title: "Share your link",
    desc: "Share schedulo.app/yourname and let people book time with you — effortlessly.",
  },
];
