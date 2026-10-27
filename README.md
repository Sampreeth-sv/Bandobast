# Bandobast — Intelligent Event Operations Platform
*One change. A thousand connections. Bandobast keeps it together.*

Built for **Celebration & Event Operations** (Weddings, Milestone Birthdays, Engagements, Family Reunions, Community Galas, and Custom Celebrations).

---

## 1. Product Overview & Core Philosophy

**Bandobast** is an event operations platform that unifies budgets, vendor proposals, guest counts, family priorities, and milestone deadlines into one living event twin.

### The Problem
During Indian celebrations and multi-function events, an upstream change (inviting 40 additional guests, advancing event dates by two weeks, or an unexpected supplier quote hike) triggers complex downstream ripple effects across catering plates, venue capacities, gift quantities, and compressed task deadlines. Most organizers manage this in chaotic spreadsheets and informal messaging groups.

### The Bandobast Solution
1. **Deterministic Event Engine:** Exact mathematical calculations across categories, per-head allocations, and real venue capacities without hardcoded category IDs.
2. **Causality & Ripple Engine:** Visually graphs interconnected impacts across upstream drivers, intermediate service lines, and bottom-line financials, with an accessible textual summary mode.
3. **Priority Compass & Trade-off Simulator:** Generates 3 genuinely distinct, mathematically balanced trade-off scenarios (*Protect the Feast*, *Protect the Guest List*, *Protect the Memories*) that never cut protected priorities and never produce negative allocations.
4. **Vendor Trust & Provenance Tracking:** All AI-extracted quotes and recommendations are explicitly marked as unverified demo estimates until confirmed by the organizer.
5. **Quote X-Ray:** Ingests vendor proposals via PDF/Image document upload or text paste, normalizes itemized deliverables, flags omitted contract clauses, and drafts multilingual follow-ups in English, Hindi, and Gujarati.

---

## 2. Visual Design System

Designed around an authentic, warm Indian celebratory aesthetic:
- **Warm Ivory Background:** `#FAF7F0`
- **White/Cream Card Surfaces:** `#FFFDF9`
- **Forest Olive (Primary Accent):** `#405B43`
- **Sage Green (Supportive Elements):** `#DCE6D6`
- **Marigold (Celebration Highlights):** `#E7A83E`
- **Terracotta (Secondary Accent):** `#C76F50`
- **Espresso Body Text:** `#302F28`
- **Muted High-Contrast Labels:** `#5A584F`
- **Soft Borders:** `#E7E0D3`
- **Typography:** Playfair Display for editorial display headings + Plus Jakarta Sans for interface text.

---

## 3. Architecture & Tech Stack

- **Frontend:** React 19 SPA, TypeScript, Tailwind CSS v4, Lucide React, Recharts for financial analytics, Canvas Confetti.
- **PWA Capabilities:** Progressive Web App with `manifest.json`, Service Worker offline caching, installation prompt banner, and viewport zoom accessibility.
- **Backend Server:** Node.js Express server running on port 3000 with Vite middleware in development mode (`tsx server.ts`) and static asset serving in production.
- **API Security & Validation:** Strict runtime request schema validation via **Zod**, in-memory sliding-window IP rate limiting, and request timeouts.
- **AI & LLM Integration:** Google Gen AI SDK (`@google/genai`) using `gemini-3.5-flash` (with automatic fallback to `gemini-3.5-flash-lite` and offline deterministic templates) with structured JSON output schemas and verified unverified provenance attribution.
- **Testing:** Native Node.js test runner (`node:test`, `node:assert`) with 23 automated tests across 8 test suites covering Zod validation, custom-event workflows, priority preservation, live/fallback AI extraction, and RFC 5545 calendar time-zone handling.

---

## 4. Key Feature Modules

### A. Home Hub & Conversation Launcher
- Dedicated landing screen welcoming organizers to Bandobast.
- **Start New Chat & Old Chats History:** Launch new AI consultations or resume previous planning sessions with full message history and budgets.
- **Interactive Budget Controller:** Real-time slider and numeric input to change the total celebration budget with immediate visual breakdowns across catering, venue, decor, photography, and contingency reserve. Click "Apply to Event" to sync changes directly into the living ledger.
- **Fast Navigation Grid:** Instant access cards to the Ripple Engine, Budget Studio, Quote X-Ray, and Timeline.

### B. Gen AI Place, Catering & Photography Recommender
- Powered by `gemini-3.5-flash` (with `gemini-3.5-flash-lite` resiliency) with budget-scaled illustrative databases.
- Clearly flags recommendations with `isIllustrativeDemo` and `verificationStatus: unverified`.
- **1-Click "Add to Event Budget":** Injects the recommended vendor or venue dynamically into the matching budget category with unverified provenance badges.

### C. Bandobast AI Advisor Chat
- Interactive conversation interface with Gemini 3.5 Flash.
- In-chat budget adjuster allowing users to adjust their budget dynamically during the consultation.
- In-memory recommendation caching to eliminate duplicate API requests.

### D. Overview Dashboard
- Living readiness indicator computed deterministically from task completion % and verified vendor quotes.
- Financial velocity metrics: Total Budget, Planned Allocations, Committed Contracts, Paid Advances, and Cost Per Guest.
- Multi-function preview cards with date, time, venue, capacity, and attire themes.

### E. Living Event Twin & Ripple Engine
- Multi-tier dependency network:
  - *Tier 1: Upstream Drivers* (Guest Headcount, Auspicious Dates).
  - *Tier 2: Direct Dependents* (Venue Capacities, Dynamic Service Categories).
  - *Tier 3: Downstream Aggregators* (Total Event Budget, Task Lead-times).
- **Dual View Modes:** Visual Canvas Graph mode and an **Accessible Textual Summary (Table Mode)** for screen readers and keyboard navigation.
- **Presets & Custom Shifts:** Test headcount changes, date shifts, and vendor rate hikes with live causality inspection.

### F. Priority Compass & Trade-off Simulator
- Rank and lock core family priorities.
- Generates 3 genuinely distinct mathematical scenarios:
  1. **Protect the Feast:** Preserves live stations & banquet catering; balances decor and media.
  2. **Protect the Guest List:** Retains full guest turnout; switches to digital photo galleries and mobilizes contingency reserve.
  3. **Protect the Memories:** Preserves complete cinematic filming; repurposes florals and optimizes dessert redundancies.
- Automatically passes simulated overruns into the trade-off engine and calculates real mathematical savings.

### G. Vendor Quote X-Ray & Clarification Drafter
- **Document Upload:** Ingests PDF documents and image rate sheets (PNG, JPG, WebP) under 6MB via secure base64 decoding.
- **Text Paste:** Supports raw WhatsApp quotation text or email breakdowns.
- **Omission Detection:** Flags unmentioned overtime rates, gratuities, and tasting sessions.
- **Review & Verification:** Extracted quotes are flagged as *Pending Review* until verified by the organizer.
- **Multilingual Drafter:** Generates professional clarification letters in English, Hindi, and Gujarati.

### H. Adaptive Timeline & Calendar Export
- Multi-function filtering across scheduled ceremonies and celebrations.
- Lead-time recomputation when dates shift.
- Downloadable standard `.ics` iCalendar file with RFC 5545 text escaping and time span formatting.
- **Indian Standard Time (IST) Time-Zone Integrity:** Embeds standard `VTIMEZONE` for `Asia/Kolkata` (`+05:30`) and formats `DTSTART;TZID=Asia/Kolkata` and `DTEND;TZID=Asia/Kolkata` without erroneous UTC `Z` suffixes, guaranteeing that an evening event scheduled for 6:00 PM IST appears accurately at 6:00 PM IST across calendar software (Google Calendar, Outlook, Apple Calendar) without UTC drift.

---

## 5. Local Setup & Running Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### Commands
```bash
# 1. Install dependencies
npm install

# 2. Run automated test suites (23 tests across 8 suites)
npm test

# 3. Type-check code
npm run lint

# 4. Production build
npm run build

# 5. Start development server (serves frontend + Express API)
npm run dev
```
npm test

# 3. Type check
npm run lint

# 4. Production build
npm run build

# 5. Start development server (Express + Vite on Port 3000)
npm run dev
```

Open `http://localhost:3000` in your browser.

### Environment Configuration (`.env`)
```env
# Optional: Gemini API Key for live generative AI extractions and chats.
# If omitted, Bandobast runs in 100% functional demo mode with structured deterministic fallbacks.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```
