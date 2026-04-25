# sportsBFF — web app

> Meet your sports BFF. No more gatekeeping.

The web app for sportsBFF — an AI sports BFF for Gen Z. Three core features: **Scan** (point your camera at a game and get the player), **Chat** (ask anything about the NFL or NBA), and **Lessons** (short structured paths from the rules to fantasy).

Domain: **sportsbff.app**
Repo: **github.com/partyanimal11/sportsbff**

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** for auth, postgres, file storage (wires in week 5)
- **OpenAI** GPT-4o (chat + vision) and GPT-4o-mini (cheap content)
- **Vercel** for hosting

## Getting started locally

### 1. Prereqs

- Node 20+
- An OpenAI API key (optional — chat works in demo mode without one)
- A Supabase project (optional — auth lands in week 5)

### 2. Install + configure

```bash
npm install
cp .env.example .env.local
# fill in your keys in .env.local — or skip and use demo mode
```

`.env.local` keys:

```
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Project layout

```
app/
  layout.tsx              Root layout
  page.tsx                Landing — Sports BFF hero
  chat/page.tsx           Chat UI
  scan/page.tsx           Scan UI
  lessons/page.tsx        Lessons library
  lessons/[...slug]/      Lesson player
  onboarding/page.tsx     Pick a show, set your lens
  settings/page.tsx       Change lens, name, league
  api/chat/route.ts       Streaming chat endpoint (demo + live)
  error.tsx               Page-level error boundary
  global-error.tsx        Root-level error boundary
  not-found.tsx           404
components/
lib/
  openai.ts
  supabase.ts             Stubbed — wires in week 5
  context.ts              Builds the system prompt
  lens.ts                 Show-lens helpers
  lessons.ts              Typed lesson data + 5 starter lessons
  demo-responses.ts       Canned answers for demo mode
  markdown.tsx            Tiny markdown renderer for chat
  profile.ts              Local profile (localStorage for now)
data/
  teams/                  All 32 NFL + 30 NBA teams
  players-sample.json     20 starter players
  shows/gossip-girl.json  Cultural reference layer
  lenses.json             11 voice profiles
  mappings.json           Cross-references (player ↔ character)
db/schema.sql             Supabase Postgres schema (week 5)
```

XOXO, sportsBFF.
