📘 ModAiGuard — AI-Powered Moderation Suite for Reddit (Devvit)

A complete, production-ready moderation platform built for the Reddit Mod Tools Hackathon.

⸻

🚀 Overview

ModAiGuard is an advanced, AI-powered moderation suite for Reddit — built on Reddit Devvit, using:

* Hono backend
* React + Vite dashboard
* Devvit Web API
* Redis KV
* Lucide UI + Tailwind

It provides moderators with an end-to-end workflow to detect, review, take action, audit logs, configure automation, generate AI recommendations, and run full auto-moderation — all inside a custom webview panel inside Reddit.

This project was fully developed for the 2026 Reddit Mod Tools & Migrated Apps Hackathon.

⸻

🎯 Key Features

🔥 1. Toxicity Analyzer (AI)

Analyze text (comments or posts) with a full signal breakdown:

* Insult
* Hate
* Threat
* Overall toxicity score
* Color-coded risk visualization
* Animated progress bars

🧨 2. Spam Detector (AI)

Signal-based spam analysis:

* Repeated phrases
* Suspicious URLs
* Keyword patterns
* Global spam risk score
* Reason breakdown

🤖 3. AI Moderator Recommendations

Combine toxicity + spam → AI recommends:

* APPROVE
* NEEDS CONTEXT
* SPAM
* REMOVE

Rules:

toxicity > 60% → remove
spam > 60% → remove
spam > 40% → spam
toxicity > 30% → needs context
otherwise → approve

👁 4. Report Review with AI Banners

View modqueue items with:

* Live AI banner on each post
* Quick actions:
    * Approve
    * Needs Context
    * Spam
    * Remove
* Automatic logging
* Auto-responder integration

📜 5. Logs (Complete Audit Trail)

Each action (manual or automatic) is logged with:

* Moderator
* Action
* Source (AIEngine, ReportReview, DemoMode)
* Toxicity & spam at action time
* AI recommendation
* Timestamp

🕵️ 6. History Lookup

Query any ThingID to see:

* Full action timeline
* AI scores
* Rules triggered
* Who made each decision

🤖 7. Auto-Responder Rules

Rules with:

* triggers[]
* AI response text
* enabled/disabled state
* delete rules
* automatic matching during moderation

Logged but not posted publicly (safe for mods).

⚙️ 8. Auto-Moderation Engine (1-click)

Runs real moderation automatically in the mod queue:

* Pulls Reddit modqueue
* Runs toxicity + spam
* Applies AI recommendation
* Takes real Reddit actions:
    * approve
    * remove
    * mark as spam
    * ignore reports
* Logs everything as auto: true

This is optional but extremely powerful.

🧪 9. Demo Mode (Safe Playground)

Because testing on real communities is hard:

* Generate fake flagged posts
* AI banners included
* Simulate mod actions
* Simulated actions go to logs (no Reddit API calls)

Perfect for hackathon judging.

🧭 10. Full Custom Dashboard (React)

Professional UI:

* Dark theme
* Animated sidebar
* Nav highlighting
* ModulePage layout
* Cards, badges, loaders, progress bars
* Seamless mod experience

⸻

🏗 Tech Stack

Backend

* TypeScript
* Hono
* Devvit Web API
* Redis KV (lists + JSON)
* Custom REST routes /api/...

Frontend

* React
* React Router
* Vite
* TailwindCSS
* Lucide Icons

Devvit

* Menus
* Custom post webviews
* Subreddit mod access
* Triggers / server components
* Permissions: redditAPI, key-value storage

📦 Project Structure

src/
├── client/                    # Full React dashboard
│   ├── App.tsx
│   ├── layouts/
│   ├── components/
│   └── modules/
│       ├── toxicity-analyzer/
│       ├── spam-detector/
│       ├── report-review/
│       ├── moderator-recommendations/
│       ├── auto-responder/
│       ├── auto-moderation/
│       ├── demo-mode/
│       ├── logs/
│       └── history/
│
├── routes/                    # Backend API endpoints
├── services/                  # Business logic (AI, logs, spam, toxicity)
├── utils/
└── serverApp.ts               # Hono router for Devvit Web
🧑‍🏫 How Mods Use It

Inside a subreddit:

1. Mod opens:

“Abrir ModAiGuard Panel” from mod tools menu.

2. Dashboard loads allowing:

* Run AI moderation
* Detect toxicity or spam
* Generate recommendations
* Review reports
* Manage auto-responder rules
* Browse logs
* Check history of specific posts
* Test in demo mode

Everything happens inside Reddit.

⸻

📌 Installation (Dev Mode)

npm install
npm run dev
This:

* Builds React client
* Serves Hono backend
* Playtests directly into <subreddit>?playtest=modaiguard

⸻

📦 Build & Upload

npm run build
npm run deploy

🔒 License

MIT License (Recommended for hackathon + GitHub).

👥 Credits

Developed by Brian (Briannamedranoc)
AI-assisted development with Cursor + ChatGPT
Built for the Reddit Mod Tools Hackathon 2026

🌟 Why It Matters (Hackathon Pitch)

Moderation on Reddit is 100% volunteer-based.
Mods are overloaded.
Queues pile up.
Harassment, spam, and malicious content slip through.

ModAiGuard solves:

* Slow manual review
* Repetitive mod tasks
* High cognitive load
* No centralized dashboard
* No analytics
* No auto-moderation
* No AI decision support

With this tool, ANY community — even small ones — can operate like a professional moderation team with:

* instant analysis
* structured decisions
* automatic triage
* complete audit trails
* optional auto-moderation
* optional demo mode for safe testing
