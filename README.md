# Schedulo — Smart Scheduling Platform

> A Calendly-like scheduling platform built with Next.js 14, MongoDB, NextAuth v5, and Gemini Flash AI.

---

## 🚀 Live Demo

> **Deploy URL:** _(Add after deploying to Vercel)_
> **Sample booking page:** `/demo/30min`

---

## 📋 Table of Contents

1. [Tech Stack & Justification](#tech-stack)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Quick Start (Local)](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Deployment (Vercel)](#deployment)
7. [Architecture Decisions](#architecture-decisions)
8. [AI Feature — Gemini Flash](#ai-feature)
9. [Tools Used](#tools-used)
10. [Assumptions & Trade-offs](#assumptions)

---

## Tech Stack & Justification <a name="tech-stack"></a>

| Layer | Choice | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | Fullstack in one repo — server components for SEO-friendly booking pages, API routes for backend, built-in routing. Vercel deployment is trivial. |
| **Styling** | Tailwind CSS | Utility-first, responsive by default, no runtime CSS overhead. Ideal for a component-heavy UI. |
| **Database** | MongoDB (Atlas free tier) | Flexible schema suits iterating on booking/availability structures. Atlas gives a free 512MB cluster — zero infra to manage. |
| **ODM** | Mongoose | Schema validation, virtuals, and middleware (e.g., hashed passwords) with type safety on top of Mongo. |
| **Auth** | NextAuth.js v5 | Handles Google OAuth (required for Calendar scope) + credentials in ~50 lines. Built-in JWT session strategy. Free forever. |
| **Calendar API** | Google Calendar API (googleapis) | Industry standard. Free for individual quota. Handles event creation, free/busy queries, and Meet link generation. |
| **AI** | Google Gemini 1.5 Flash (REST) | **Free tier** — 15 RPM, 1M tokens/day. No credit card. Excellent at structured JSON output for slot matching. |
| **Email** | Nodemailer + Gmail SMTP | Free with a Gmail App Password. No SendGrid/Mailgun needed for a demo/MVP. |
| **Date handling** | date-fns + date-fns-tz | Lightweight, tree-shakeable, excellent timezone support vs. moment.js. |
| **Deployment** | Vercel | Zero-config Next.js deployment, serverless functions, edge network, free tier. |

---

## ✨ Features <a name="features"></a>

### Core
- **User Registration & Authentication** — Email/password (bcrypt) + Google OAuth
- **Public Booking Pages** — `/:username` (profile) and `/:username/:eventSlug` (booking)
- **Event Types** — Create/edit/delete meeting types (15–120 min, custom colors, descriptions)
- **Availability Scheduler** — Per-day weekly schedule with multiple time windows + timezone support
- **Slot Generation Algorithm** — Respects availability, existing bookings, buffer times, advance notice, and booking windows
- **Double-Booking Prevention** — Server-side slot re-validation at booking time (optimistic concurrency check)
- **Google Calendar Sync** — Auto-creates calendar events with attendees + optional Meet link on booking
- **Timezone Support** — Invitee timezone auto-detected via `Intl.DateTimeFormat()`. All times stored in UTC, displayed in local time.
- **Email Confirmations** — Beautiful HTML emails with cancel links sent to both host and invitee
- **Booking Cancellation** — Secure token-based cancel links (no login required for invitee)
- **Dashboard** — Upcoming meetings, stats, quick actions

### AI Bonus — Gemini Flash
- **Smart Scheduling Assistant** — Embedded on every booking page. Invitee types natural language ("Book me something Tuesday afternoon") → Gemini parses intent → returns matching available slots as clickable buttons.
- **Multi-day context** — AI fetches 14 days of slots in parallel before querying Gemini, giving it full context to reason about.
- **Free** — Uses `gemini-1.5-flash` via REST API at `aistudio.google.com`. No billing needed.

---

## 📁 Project Structure <a name="project-structure"></a>

```
schedulo/
├── app/
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (dashboard)/              # Protected dashboard pages
│   │   ├── dashboard/            # Main dashboard
│   │   ├── event-types/          # CRUD for event types
│   │   ├── availability/         # Weekly schedule editor
│   │   └── settings/             # Profile + Google Calendar
│   ├── [username]/               # Public profile page
│   │   └── [eventSlug]/          # Public booking page
│   ├── book/[bookingId]/         # Confirmation + cancellation pages
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   ├── event-types/          # Event type CRUD API
│   │   ├── availability/         # Availability API
│   │   ├── slots/                # Slot generation API (public)
│   │   ├── bookings/             # Booking creation & management
│   │   ├── ai/assistant/         # Gemini AI assistant endpoint
│   │   └── users/me/             # Profile API
│   ├── layout.js                 # Root layout (Inter font, SessionProvider)
│   ├── page.js                   # Landing page
│   └── globals.css               # Tailwind + custom CSS
│
├── components/
│   ├── booking/
│   │   └── BookingFlow.js        # Multi-step booking wizard (client)
│   └── dashboard/
│       ├── Sidebar.js            # Responsive sidebar nav
│       ├── EventTypeCard.js      # Event type management card
│       └── CopyLinkButton.js     # Clipboard copy with feedback
│
├── lib/
│   ├── db.js                     # Mongoose connection (cached)
│   ├── mongoClient.js            # Native MongoClient for NextAuth adapter
│   ├── slots.js                  # Core scheduling algorithm
│   ├── gemini.js                 # Gemini Flash AI integration
│   ├── googleCalendar.js         # Google Calendar API helpers
│   ├── email.js                  # Nodemailer email templates
│   └── utils.js                  # Shared utilities + constants
│
├── models/
│   ├── User.js                   # User schema (OAuth + credentials)
│   ├── EventType.js              # Event type schema
│   ├── Availability.js           # Weekly availability schema
│   └── Booking.js                # Booking schema
│
├── auth.js                       # NextAuth v5 config (root)
├── middleware.js                  # Route protection
├── .env.example                  # Environment variable template
└── README.md
```

---

## ⚡ Quick Start (Local) <a name="quick-start"></a>

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) free cluster (M0)
- A [Google Cloud](https://console.cloud.google.com) project with:
  - Google Calendar API enabled
  - OAuth 2.0 credentials (Web application)
- A [Gemini API key](https://aistudio.google.com) (free, no credit card)

### Steps

```bash
# 1. Clone / unzip the project
cd schedulo

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Fill in all values (see Environment Variables section below)

# 4. Run development server
npm run dev

# 5. Open http://localhost:3000
```

---

## 🔑 Environment Variables <a name="environment-variables"></a>

```bash
# App URL (change to your domain in production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.xxx.mongodb.net/schedulo

# NextAuth secret (generate: openssl rand -base64 32)
AUTH_SECRET=your_secret_here

# Google OAuth (console.cloud.google.com)
# Required scopes: openid, email, profile, https://www.googleapis.com/auth/calendar
# Redirect URI: http://localhost:3000/api/auth/callback/google
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# Gemini AI (aistudio.google.com → Get API Key → free)
GEMINI_API_KEY=AIzaSy-xxxx

# Email (Gmail App Password: myaccount.google.com/apppasswords)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=you@gmail.com
EMAIL_SERVER_PASSWORD=xxxx xxxx xxxx xxxx
EMAIL_FROM=Schedulo <you@gmail.com>
```

### Google OAuth Setup (step-by-step)
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project → **Enable APIs** → search "Google Calendar API" → Enable
3. **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://your-vercel-domain.vercel.app/api/auth/callback/google` (prod)
6. Copy Client ID and Client Secret to `.env.local`

---

## 🚢 Deployment (Vercel) <a name="deployment"></a>

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, then add env vars in Vercel dashboard:
# Project Settings → Environment Variables
# Add all variables from .env.example
```

**Or via GitHub:**
1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Project Settings
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel domain
5. Add Vercel domain to Google OAuth redirect URIs

---

## 🏗️ Architecture Decisions <a name="architecture-decisions"></a>

### Scheduling Algorithm (lib/slots.js)
The core algorithm runs server-side and:
1. Reads the user's weekly `Availability` schedule for the requested date
2. Checks for date overrides (holidays/vacations)
3. Generates time slots by iterating through each availability window in `duration + buffer` increments
4. Removes slots that overlap with existing confirmed bookings (with 1-minute grace)
5. Removes slots before `now + advanceNotice`
6. Returns slots in the **invitee's** timezone for display, with UTC timestamps for storage

### Double-Booking Prevention
When a booking is submitted:
- The slot algorithm runs again server-side to re-validate
- If the slot was taken between page load and submission, a `409 Conflict` is returned
- This is sufficient for a single-server setup. For high-scale, a MongoDB transaction or distributed lock (Redis) would be used.

### Token-Based Cancellation
Each booking gets a cryptographically random 64-char hex `cancelToken`. Cancel links are `{appUrl}/book/{id}/cancel?token={token}`. No session required for invitees.

### Google Calendar Sync
- Google tokens stored encrypted in MongoDB via NextAuth adapter
- Calendar event creation is fire-and-forget (non-blocking) — booking succeeds even if Calendar API fails
- Meet links auto-generated for `google_meet` event types via `conferenceData`

### AI Architecture
- The `/api/ai/assistant` route is a thin proxy to Gemini Flash REST API
- The client pre-fetches 14 days of slots in parallel (14 API calls), attaches date labels, and sends them as context
- Gemini returns JSON `{ message, slotIndices }` — strongly typed via prompt engineering
- Temperature set to 0.3 for deterministic slot-matching

---

## 🤖 AI Feature — Gemini Flash <a name="ai-feature"></a>

The **Smart Scheduling Assistant** is embedded on every public booking page.

**How it works:**
1. User types a natural language request: *"Find me something Wednesday morning"*
2. Client fetches available slots for the next 14 days in parallel
3. Slots are sent as structured context to `gemini-1.5-flash` via Google AI Studio API
4. Gemini returns `{ message: "...", slotIndices: [3, 5] }` — matching slot indices
5. Slots are displayed as clickable buttons; clicking one jumps directly to the booking form

**Why Gemini Flash:**
- Free tier: 15 RPM, 1 million tokens/day — more than enough for demos
- No credit card required (unlike OpenAI)
- Fast response (~1s), suitable for interactive UI
- Get API key at [aistudio.google.com](https://aistudio.google.com)

---

## 🛠️ Tools Used <a name="tools-used"></a>

| Tool | Usage |
|---|---|
| **Claude (Anthropic)** | Full codebase generation, architecture design, prompt engineering for Gemini integration |
| **Next.js 14 docs** | App Router patterns, Server Components, API routes |
| **MongoDB Atlas** | Free cloud database hosting |
| **Google AI Studio** | Free Gemini API key |
| **Vercel** | Deployment platform |
| **date-fns** | All date/time manipulation and timezone conversion |
| **Lucide React** | Icon library |

---

## 📝 Assumptions & Trade-offs <a name="assumptions"></a>

**Assumptions:**
- One availability schedule per user (not per event type). This is simpler and matches Calendly's default behaviour.
- Invitees don't need accounts — they just provide name + email.
- Google Calendar is the only calendar integration for now (Outlook would need Microsoft Graph API — same pattern, different OAuth).
- Emails use Gmail SMTP for free delivery. In production, swap for SendGrid/Resend.

**Known trade-offs:**
- **No Outlook integration** — Would require Microsoft Azure OAuth setup (same code pattern as Google, just different provider).
- **No payment integration** — Calendly charges for paid events; this is out of scope for the 7-day build.
- **No reschedule flow** — Cancel + re-book is the current flow. A proper reschedule page would reuse the booking wizard with the old booking pre-filled.
- **SQLite not used** — MongoDB was chosen for schema flexibility. For a solo developer, SQLite + Prisma would be faster to iterate on locally.
- **No rate limiting** — In production, add `@upstash/ratelimit` on booking and AI endpoints.

---

## 📄 License

MIT — free to use, modify, and deploy.
