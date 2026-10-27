# Bandobast — Intelligent Event Operations Platform
*One change. A thousand connections. Bandobast keeps it together.*

Built for **PromptWars Challenge 5: Celebration & Event Planner**.

---

## 1. Product Overview & Intended Persona

**Bandobast** is an AI-powered event operations platform that connects budgets, vendor quotations, guest counts, family priorities, and deadlines into one living event twin.

### The Problem
During Indian weddings and large celebrations, a seemingly innocent change (e.g. inviting 40 additional guests, moving the auspicious wedding date earlier by two weeks, or an unexpected 20% vendor price hike) triggers chaotic, hidden downstream ripple effects across catering plates, venue capacities, gift counts, and milestone deadlines. Most organizers manage this in disjointed spreadsheets and WhatsApp groups.

### The Solution
Bandobast maintains a unified living event twin. When an upstream parameter changes:
1. **Deterministic code** calculates exact financial math, per-head catering allocations, and venue capacity limits.
2. The **Ripple Engine** visually highlights affected nodes, flags capacity overruns, and explains why items changed.
3. The **Priority Compass** generates 3 genuinely distinct, mathematically balanced trade-off scenarios (*Protect the Feast*, *Protect the Guest List*, *Protect the Memories*) respecting family mandates.
4. The organizer can inspect and **apply** an approved scenario, instantly synchronizing the entire event plan.
5. **Quote X-Ray** parses vendor proposals, flags omitted fees ("Not mentioned — ask vendor"), and drafts multilingual inquiries in English, Hindi, and Gujarati.

---

## 2. Visual Design System

Designed strictly around warm, elegant Indian celebratory aesthetics:
- **Warm Ivory Background:** `#FAF7F0`
- **White/Cream Card Surfaces:** `#FFFDF9`
- **Forest Olive (Primary Accent):** `#405B43`
- **Sage Green (Supportive Elements):** `#DCE6D6`
- **Marigold (Celebration Highlights):** `#E7A83E`
- **Terracotta (Secondary Accent):** `#C76F50`
- **Espresso Body Text:** `#302F28`
- **Muted Text:** `#77756B`
- **Soft Borders:** `#E7E0D3`
- **Typography:** Playfair Display for editorial display headings + Plus Jakarta Sans / Inter for clean interface readability.

---

## 3. Architecture & Core Tech Stack

- **Frontend:** React 19 SPA, TypeScript, Tailwind CSS v4, Lucide React icons, Recharts for financial analytics, Canvas Confetti.
- **PWA Capabilities:** Complete Progressive Web App with `manifest.json`, Service Worker offline caching, home screen install prompt banner, and shortcut actions.
- **Backend Server:** Node.js Express server running on port 3000 with Vite middleware in development mode (`tsx server.ts`).
- **AI & LLM Integration:** Official Google Gen AI SDK (`@google/genai`) using `gemini-2.5-flash` with structured JSON output schemas and robust deterministic demo fallbacks.
- **Testing:** Native Node.js test runner (`node:test`, `node:assert`) with automated unit tests for ripple propagation, capacity checks, and budget balance.

---

## 4. Key Feature Modules

### A. Home Hub & Conversation Launcher
- Dedicated landing screen welcoming organizers to Bandobast.
- **Start New Chat & Old Chats History:** Launch new AI consultations or resume previous planning sessions with full message history and budgets.
- **Interactive Budget Controller:** Real-time slider and numeric input to change the total celebration budget with immediate visual percentage breakdowns across catering, venue, decor, photography, and contingency reserve. Click "Apply to Event" to sync changes directly into the living ledger.
- **Fast Navigation Grid:** Instant access cards to the Ripple Engine, Budget Studio, Quote X-Ray, and Timeline.

### B. Gen AI Place, Catering & Photography Recommender
- Powered by `gemini-3.8-flash` with curated fallback data matching the exact budget specified by the user.
- **Venues & Places:** Heritage Havelis, palace courtyards, luxury resort lawns, and banquet halls with capacity ratings, pricing tiers, and contact numbers.
- **Food & Catering:** Authentic royal thali caterers, live chaat & dessert station specialists, and Satvik/Jain menus with per-plate pricing calibrated to the headcount.
- **Photography & Cinematography:** Candid photographers, 4K cinematic drone studios, and heirloom album packages.
- **Decoration & Florals:** Vedic mandap artists, marigold canopy specialists, and ambient lighting designers.
- **1-Click "Add to Event Budget":** Injects the recommended vendor or venue directly into the active event's budget ledger with provenance tracking.

### C. Bandobast AI Advisor Chat
- Interactive conversation interface with Gemini 3.8 Flash.
- In-chat budget adjuster pill allowing users to change their budget during the conversation.
- Structured recommendation widgets embedded within the chat stream with instant "Add to Budget" actions.
- Pre-built prompt suggestions for venue discovery, catering plate calculations, and budget division strategies.

### D. Overview Dashboard
- Living readiness indicator computed deterministically from task completion % and confirmed vendor quotes.
- Financial velocity metrics: Total Budget, Planned Allocations, Committed Contracts, Paid Advances, and Cost Per Guest.
- Multi-function preview cards with date, time, venue, capacity, and attire themes.
- Active Ripple Simulation impact banner with direct links to rebalance trade-offs.

### B. Living Event Twin & Ripple Engine (Signature Feature)
- Multi-tier visual dependency network:
  - *Tier 1: Upstream Drivers* (Guest Headcount, Auspicious Dates).
  - *Tier 2: Direct Dependents* (Venue Capacity, Royal Rasoi Catering, Return Favors).
  - *Tier 3: Downstream Aggregators* (Total Event Budget, Task Lead-times).
- **Preset 1 (Guest Increase):** Attendance jumps from 180 to 220. Recalculates catering lines, flags Heritage Lawns capacity alert (max 200 pax; 20 over capacity).
- **Preset 2 (Date Shift):** Moves wedding dates 2 weeks earlier. Recalculates all dependent task deadlines; flags overdue lead times.
- **Preset 3 (Vendor Price Spike):** Applies +20% price hike on catering and florals; recalculates budget overrun and prompts Trade-off Simulator.
- **Node Inspector:** Click any node to inspect causality, trigger source, authoritative data source, and recommended next actions.

### C. Priority Compass & Trade-off Simulator
- Rank and lock core family priorities (Food Quality, Photography, Hospitality, Decor, Guest Count, Convenience).
- Generates 3 genuinely distinct mathematical scenarios:
  1. **Protect the Feast:** Preserves live stations & 4-course banquet; trims decor and drone package to save ₹26,000.
  2. **Protect the Guest List:** Retains full 220 guests; switches to digital cloud photo galleries and mobilizes contingency reserve to save ₹28,500.
  3. **Protect the Memories:** Preserves 4K cinema teaser and heirloom album; re-purposes morning florals for evening stage and trims dessert courses to save ₹25,000.
- Click **"Apply to Living Plan"** to update budget allocations, line items, and provenance records across all views.

### D. Vendor Quote X-Ray & Clarification Drafter
- Paste quotation text or upload vendor proposals.
- Structured line-item breakdown with unit prices, subtotals, GST, and terms.
- Explicit detection of omissions ("Overtime charges not mentioned — ask vendor", "Staff gratuity not specified").
- Multilingual clarification inquiry generator (English, Hindi, Gujarati) with one-click copy draft.

### E. Adaptive Timeline & Calendar Export
- Multi-function filtering (Mehendi, Sangeet, Vedic Wedding, Reception, Combined).
- Lead-time recomputation when dates shift.
- Task completion toggles directly feeding into overall Event Readiness.
- Downloadable standard `.ics` iCalendar file for syncing with Google Calendar or Apple Calendar.

### F. Multi-Event Versatility
- Supports Weddings, Milestone Birthdays, Engagements, Family Reunions, and Community Galas.
- Preloaded with two full celebrations:
  1. *Aarav & Meera's Wedding Celebration* (Multi-function Indian wedding).
  2. *Arjun's 30th Milestone Rooftop Soiree* (Milestone birthday template).

---

## 5. Requirement-to-Feature Mapping (PromptWars Challenge 5)

| Challenge Requirement | Bandobast Implementation | Verification |
|---|---|---|
| **Visual Palette** (Ivory, Olive, Sage, Marigold, Terracotta) | Configured in Tailwind v4 theme & applied across all screens | Inspected & styled |
| **Living Event Twin / Ripple Engine** | Deterministic multi-variable graph engine in `src/services/rippleEngine.ts` | Tested via `tests/rippleEngine.test.ts` |
| **Scenario 1: Headcount Increase (180 → 220)** | Live per-guest math + venue capacity overrun alert (Heritage Lawns cap: 200) | Test #3 passes |
| **Scenario 2: Earlier Date (-14 days)** | Dynamic lead-time recomputation flagging overdue milestones | Test #4 passes |
| **Scenario 3: Vendor Price Hike (+20%)** | Financial ceiling calculation with overrun alerts | Test #5 passes |
| **Trade-off Simulator (3 Scenarios)** | Mathematically distinct scenarios respecting Priority Compass | Test #6 passes |
| **Apply Scenario to Event** | State mutation with provenance updating Budget, Timeline & Twin | Test #7 passes |
| **Quote X-Ray & Omission Detection** | Identifies missing GST, overtime & drafting multilingual inquiries | `/api/quote/extract` & UI |
| **Data Provenance System** | Badges on line items: `quoted`, `user_entered`, `ai_estimate`, `illustrative` | `ProvenanceBadge.tsx` |
| **Calendar Sync** | Downloadable `.ics` export with events & milestone deadlines | Test #8 passes |
| **Multi-Event Support** | Reusable architecture supporting Weddings, Birthdays, Community events | Event Wizard & Switcher |
| **PWA Compliance** | Web app & installable app at the same time with manifest, SW, & icons | `manifest.json` & `sw.js` |

---

## 6. Local Setup & Running Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Run automated verification tests
npm test

# 3. Start development server (Express + Vite on Port 3000)
npm run dev

# 4. Open in browser:
# http://localhost:3000
```

### Environment Variables (`.env.example`)
```env
# Optional: Gemini API Key for dynamic live AI extractions.
# If omitted, Bandobast runs in 100% functional demo mode with structured deterministic fallbacks.
GEMINI_API_KEY="MY_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
```

---

## 7. Automated Test Suite

Run tests:
```bash
npm test
```
Validates:
1. Deterministic budget math & remaining balance
2. Event readiness algorithm
3. Headcount increase & venue capacity overflow checks
4. Date compression & overdue task detection
5. Vendor quote spike propagation
6. Priority Compass: 3 distinct scenarios
7. Scenario application & provenance tracking
8. iCalendar `.ics` valid generation
