# MuniFix

A smart citizen-to-municipality infrastructure reporting platform, built for the Geekulcha Annual Hackathon 2026.

Residents report potholes, water leaks, power outages, waste issues and more with a photo and GPS pin. An AI-assisted intake auto-fills category, priority and department. Municipal officials triage, assign, and resolve issues on a live dashboard, and residents get the final say: they confirm a fix or reject it and reopen the case. Overdue issues auto-escalate.

This is a real, working full-stack app — not a mockup. It has actual authentication (JWT + bcrypt), a real database (SQLite, file-backed, zero setup), real image uploads to disk, real geolocation handling, and a real backend escalation job.

## Tech stack

- **Frontend**: Next.js 14 (App Router) + React 18, Tailwind CSS, Lucide icons, React-Leaflet / Leaflet for the live map
- **Backend**: Next.js Route Handlers (Node.js) — no separate server process needed
- **Database**: SQLite via Node's built-in `node:sqlite` module, file-backed at `db/munifix.sqlite`. No external database service and no native module to compile — this is a deliberate substitution for Postgres/Prisma so the app runs with a single `npm install` on any judge's laptop with zero extra setup (no Visual Studio Build Tools / Xcode Command Line Tools needed, unlike `better-sqlite3` or other native SQLite bindings). Requires **Node.js 22.5+** (ships in Node itself; tested on Node 22 and 24). Swapping in Postgres later is a matter of replacing `db/index.js` and `db/schema.sql`; every query goes through the `db` singleton.
- **Auth**: JWT signed with `jsonwebtoken`, stored in an httpOnly cookie; passwords hashed with `bcryptjs`
- **Storage**: Local disk uploads under `public/uploads/`, served statically by Next.js

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the environment file (defaults work out of the box)
cp .env.example .env.local

# 3. Seed the database with demo users and sample complaints
npm run seed

# 4. Start the dev server
npm run dev
```

Open http://localhost:3000.

To run a production build instead of dev mode:

```bash
npm run build
npm run start
```

The SQLite file and schema are created automatically on first run — there is nothing else to provision.

### Demo accounts

Seeded by `npm run seed` (password for all: `password123`):

| Role             | Email                | Notes                                   |
|------------------|-----------------------|------------------------------------------|
| Resident          | `thabo@example.com`   | Has filed several of the sample complaints |
| Resident          | `lindiwe@example.com` | Second resident, for testing "Me Too" votes |
| Municipal Admin   | `admin@munifix.gov`   | Full access to `/admin`                 |

The seed script also creates **7 sample complaints** spanning every status (`SUBMITTED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REOPENED`), one of which is already flagged overdue, plus a sample emergency log — so every screen has real data to show immediately.

To wipe and reseed at any time:

```bash
rm -f db/munifix.sqlite*
npm run seed
```

## Feature walkthrough (maps to the brief)

- **AI-assisted reporting** (`/dashboard/new`): type a free-text description and hit "Auto-fill with AI" — a rule-based NLP engine (`src/lib/aiParser.js`) extracts category, priority and a location hint from the text (e.g. "water leak... since yesterday... urgent" → `WATER` / `CRITICAL`). Uploading a photo also runs a lightweight vision-classifier heuristic against the filename/keywords. Both are real, working code paths (`/api/ai/parse`, `/api/ai/vision`) — swap the function body for a real Claude API call later without touching any caller.
- **Smart routing** (`src/lib/categories.js`): every category maps to exactly one municipal department and a default response-time window, applied automatically on submission.
- **Live service-delivery map** (`/map`): color-coded Leaflet pins (red = submitted, amber = assigned/in progress, green = resolved), click for a popup with photo, status and "Me Too" count.
- **Resolution verification** (`/complaints/[id]`): when an official marks an issue resolved with proof, the resident sees a Confirm/Reject prompt. Rejecting reopens the complaint, bumps its priority, and shortens its deadline (`/api/complaints/[id]/confirm`).
- **Automatic escalation** (`src/lib/escalation.js`): any open complaint past its `response_deadline` is flagged `is_overdue`, bumped a priority level, and logged as an audit event. This sweep runs inline on every dashboard/admin read (so the demo is "live" with no scheduler needed) and is also exposed at `POST /api/cron/escalate` for a real external cron job.
- **Emergency button** (`/emergency`): captures GPS instantly, shows local emergency numbers, and logs the incident server-side.
- **Municipal dashboard** (`/admin`): KPI cards, filterable/sortable complaint table, and an action drawer to reassign status, department, team, priority, deadline, and attach proof-of-resolution.

## Project structure

```
munifix/
├── db/
│   ├── schema.sql         # SQLite schema (users, complaints, metoo_votes, emergency_logs, complaint_events)
│   ├── index.js           # DB connection singleton (auto-creates + applies schema)
│   └── seed.js            # Seed script — 2 residents, 1 admin, 7 sample complaints, 1 emergency log
├── src/
│   ├── app/
│   │   ├── api/            # Route handlers (the "backend")
│   │   ├── dashboard/       # Resident dashboard + new-complaint form
│   │   ├── complaints/[id]/ # Complaint detail + tracking + confirm/reject
│   │   ├── map/             # Public live service-delivery map
│   │   ├── admin/           # Municipal management dashboard
│   │   ├── emergency/       # One-tap emergency page
│   │   ├── login/, register/
│   │   └── layout.js, page.js, globals.css
│   ├── components/          # Navbar, MapView, ComplaintCard/Table, ActionPanel, badges, KPI cards…
│   └── lib/                 # auth, categories/routing, AI parser, escalation, upload, UI config
└── public/uploads/          # Uploaded photos land here, served statically
```

## Notes on the AI features

Per the brief, the "AI Assistant" and "Vision Classifier" are implemented as deterministic, fully-functional rule engines rather than calls to a paid external model — this keeps the MVP runnable with zero API keys for judging. The interfaces (`parseComplaintText`, `classifyImageHint` in `src/lib/aiParser.js`) are written so a real LLM/vision call can be dropped in later without changing any route or UI code.
