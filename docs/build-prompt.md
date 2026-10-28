# Tadabbur Build Prompt

Oct 23, 2026 · @Ramiz

## How to use this prompt

Paste everything below this section into your coding agent (Claude Code, Cursor, Windsurf or similar) as the first message in an empty project folder. Work through one milestone at a time and review each before saying "continue".

**Your role (to the agent):** You are a senior full-stack engineer building Tadabbur, a production web app. Build it properly: typed, tested, accessible and ready to deploy. Work milestone by milestone. At the end of each milestone, stop, summarise what you built, list anything you assumed, and wait for approval. Ask before adding any paid service or changing the stack.

## Product brief

Tadabbur collects Qur'an recitations from living people who pray in mosques around the world. Each recitation is pinned to the mosque where it was recorded, with a short profile of the reciter.

- **Name:** Tadabbur, shown in Arabic as تَدَبُّر ("deep reflection"). The Arabic wordmark is primary; the Latin name sits beside it.
- **Slogan:** *Hear the Qur'an in the voices of the living.*
- **Who it's for:** listeners who want everyday, local voices rather than famous qaris; reciters and mosques who want to share their community's recitation.

**The two core parts:**

1. **Listen** — a player for recited verses. Play a random recitation, or search and filter by surah, reciter, mosque or city.
2. **Map** — an interactive world map with a pin for every mosque that has recitations. Tapping a pin shows the recitations recorded there and each reciter's profile.

**Each recitation carries:**

- The audio, and the surah and ayah range recited (with Arabic text and an English translation)
- Date, time, prayer (e.g. Fajr, Taraweeh, Jumu'ah) and mosque
- Reciter profile: name, optional photo, short bio
- Answers to a few reflection questions: why this surah, favourite ayah, where they learned to recite

**Reference prototype:** a static mockup exists with London sample data, a dark "night prayer" palette, a waveform player and a pin map. Match its look and feel; rebuild everything properly.

## Tech stack and structure

Use this stack unless there is a strong reason not to. Explain any change before making it.

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript, strict mode | SSR for shareable recitation pages, one codebase |
| Styling | Tailwind CSS with design tokens as CSS variables | Light and dark themes from one token set |
| Database | Supabase Postgres with PostGIS | Geo queries for map pins; row-level security |
| Auth | Supabase Auth (email magic link + Google) | Uploaders need accounts; listeners don't |
| File storage | Supabase Storage (audio + photos) | Signed upload URLs, CDN delivery |
| Map | MapLibre GL JS with free OpenStreetMap-based vector tiles (e.g. MapTiler free tier or Protomaps) | No Google Maps lock-in; clustering built in |
| Audio | Native HTML audio + WaveSurfer.js for the waveform | Simple, reliable playback |
| Qur'an text | Tanzil Uthmani text + a public-domain English translation, bundled as JSON | Works offline; no runtime API dependency |
| Validation | Zod, shared between client and server | One schema for forms and API |
| Testing | Vitest (unit) + Playwright (end to end) | Covers logic and key user flows |
| Hosting | Vercel + Supabase | Free tiers cover the prototype stage |

Suggested folder layout:

```
app/
  (site)/page.tsx            # Listen (home)
  map/page.tsx               # World map
  r/[id]/page.tsx            # Single recitation (shareable)
  reciters/[id]/page.tsx     # Reciter profile
  mosques/[id]/page.tsx      # Mosque page
  upload/page.tsx            # Upload flow (signed in)
  admin/page.tsx             # Moderation queue
  api/...                    # Route handlers
components/                  # Player, MapView, RecitationCard, AyahText, ...
lib/                         # supabase client, quran helpers, zod schemas
data/quran/                  # Bundled surah + ayah JSON
supabase/migrations/         # SQL schema + RLS policies
supabase/seed.sql            # London sample data
tests/                       # Vitest + Playwright
```

## Data model

Create these tables as Supabase migrations, with row-level security on every table. Public visitors can read only `approved` recitations. Uploaders can edit their own drafts. Admins can do everything.

| Table | Key columns | Notes |
| --- | --- | --- |
| `profiles` | id (= auth user id), display\_name, role (`listener` / `reciter` / `admin`) | One per account |
| `reciters` | id, profile\_id (nullable), name, photo\_url, bio, age\_range, occupation, heritage, consent\_photo, consent\_public | A reciter can exist without an account (uploaded by a mosque) |
| `mosques` | id, name, address, city, country, location (PostGIS `geography(Point)`), website, verified | Pins sit on mosques, never on homes |
| `recitations` | id, reciter\_id, mosque\_id, surah (1–114), ayah\_start, ayah\_end, audio\_url, duration\_sec, recorded\_at (timestamptz), prayer (enum), status (`draft` / `pending` / `approved` / `rejected`), created\_by | Validate ayah range against surah length; add `is_sample` boolean to this table and `reciters` |
| `reflections` | id, recitation\_id, question\_key, answer\_text, favourite\_surah, favourite\_ayah | Question keys: `why_surah`, `favourite_ayah`, `where_learned`, `what_it_means` |
| `reports` | id, recitation\_id, reason, details, created\_by, resolved | Flag wrong data or inappropriate content |
| `plays` | recitation\_id, played\_at | Anonymous counts only; no user tracking |

Prayer enum: `fajr`, `dhuhr`, `asr`, `maghrib`, `isha`, `jumuah`, `taraweeh`, `qiyam`, `eid`, `halaqah`, `other`.

Add a view or RPC `mosques_with_counts(bbox)` that returns mosques inside a map bounding box with their approved recitation count, for loading pins.

## Features

### Listen (home page)

- Large "now playing" stage: Arabic ayah text (right-to-left), English translation, surah name and ayah reference, reciter avatar and name, mosque, prayer and date.
- Waveform with seek, play/pause, previous/next, playback speed (0.75×–1.25×) and repeat ayah.
- **Random recitation** button that picks from approved recitations, never the one just played.
- Search across surah (English and Arabic names), reciter, mosque and city, with surah filter chips and a city filter.
- A persistent mini-player that keeps playing across page navigation.
- "See on map" jumps to the map and focuses that mosque.
- Lock-screen controls through the Media Session API.

### Map

- Full-width MapLibre map. Opens on the user's region if they allow location, otherwise on a world view.
- Pins load by bounding box as the user pans. Pins cluster when zoomed out, showing a count.
- Tapping a pin opens a side panel (bottom sheet on mobile) listing that mosque's recitations.
- Selecting a recitation shows the full reciter profile: photo or generated avatar, bio, surah, prayer, date and time, length, and reflection answers. Include a "Play" button.
- Optional thin qibla line from the selected mosque toward Makkah, calculated with the great-circle bearing.

### Recitation and reciter pages

- `/r/[id]`: shareable page with Open Graph image (ayah text + reciter name) for link previews.
- `/reciters/[id]` and `/mosques/[id]`: all approved recitations for that person or place.

### Upload (signed in)

A multi-step form with progress saved as a draft:

1. **Audio** — upload MP3, M4A, WAV or WebM, max 25 MB and 15 minutes. Show a preview player. Convert to a consistent format on the server if practical.
2. **What was recited** — surah picker (searchable) and ayah range, validated against the surah length. Show the Arabic text so the uploader can confirm.
3. **When and where** — mosque search (existing mosques first), or add a new mosque by dropping a pin. Date, time and prayer.
4. **Reciter** — pick an existing reciter or add one: name, optional photo, bio. Explicit consent checkboxes for public display and for the photo.
5. **Reflections** — answer two or more of the questions. All optional except one.
6. **Review and submit** — status becomes `pending`.

### Moderation (admin)

- Queue of pending recitations with audio, text and profile side by side. Approve, reject with a reason, or edit metadata.
- Reports list with resolve action.
- Verify or merge duplicate mosques.

## Design system

The look is a quiet "night prayer" room: deep teal-black, warm lamp amber as the one accent, and Arabic calligraphy as the hero. Dark is the default theme; build a matching light theme from the same tokens.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | #0e1819 | #eef1ed | Page background |
| `--panel` | #152224 | #ffffff | Cards, side panels |
| `--raise` | #1c2c2f | #f5f7f3 | Hover and selected rows |
| `--line` | #2a3c3f | #d4dcd6 | Borders, dividers |
| `--fg` | #ece6d8 | #13201f | Main text |
| `--muted` | #97a6a2 | #5b6b67 | Secondary text |
| `--lamp` | #e2a64c | #a86a12 | Accent: play button, pins, active states |
| `--water` | #1f4250 | #bcd7dc | Map water |

**Typography (Google Fonts via `next/font`):**

- Wordmark: Aref Ruqaa, bold
- Qur'anic text: Amiri (or KFGQPC Uthmanic Hafs if licensing allows), generous line height (\~1.9)
- Display headings: Instrument Serif
- Body and UI: IBM Plex Sans
- Labels, times and data: IBM Plex Mono, uppercase with letter-spacing for small labels

**Arabic handling:**

- Wrap all Arabic in `lang="ar" dir="rtl"`. The page stays left-to-right; only Arabic blocks flip.
- Render ayah text exactly from the bundled source. Never let fonts, CSS transforms or AI alter it.
- Show ayah-end markers (۝ with the number) between verses.

**Other rules:**

- No images of faces without consent. Without a photo, show a generated avatar: an eight-point star tile with the reciter's initials, coloured by a hash of their id.
- Mobile first: map panels become bottom sheets; the player becomes a sticky bar.
- WCAG 2.2 AA contrast, visible focus rings, full keyboard support on the map and player, and `prefers-reduced-motion` respected.

## Seed data (London)

Write `supabase/seed.sql` with these 12 sample recitations. The mosques are real; the reciters are fictional and must be marked `is_sample = true` so they can be wiped before launch. There is no real audio yet: point every `audio_url` to one short silent placeholder file, and show a "Sample — audio coming soon" badge in the UI when `is_sample` is true. Coordinates are approximate; correct them against OpenStreetMap.

| Reciter (fictional) | Occupation | Mosque | Lat, Lng | Surah : ayah | Prayer | Recorded |
| --- | --- | --- | --- | --- | --- | --- |
| Yusuf Rahman, 34 | Paramedic | East London Mosque, Whitechapel | 51.5175, -0.0653 | Ash-Sharh 94:5–6 | Isha | 2026-09-14 20:41 |
| Ibrahim Al-Hashimi, 61 | Retired engineer | London Central Mosque, Regent's Park | 51.5287, -0.1675 | Ar-Rahman 55:13 | Fajr | 2026-08-02 04:52 |
| Amina Okafor, 27 | Architect | Brixton Mosque | 51.4630, -0.1110 | Ad-Duha 93:3 | Sisters' halaqah | 2026-10-03 11:15 |
| Hamza Siddiqui, 19 | Maths student | Harrow Central Mosque | 51.5850, -0.3380 | Al-Mulk 67:1 | Taraweeh | 2026-03-08 21:30 |
| Mehmet Yıldız, 45 | Baker | Suleymaniye Mosque, Dalston | 51.5389, -0.0757 | Al-Ikhlas 112:1 | Dhuhr | 2026-07-21 13:20 |
| Abdullah Farah, 38 | Bus driver | Finsbury Park Mosque | 51.5636, -0.1069 | Ar-Ra'd 13:28 | Asr | 2026-06-11 17:05 |
| Naveed Ahmad, 52 | Pharmacist | Baitul Futuh, Morden | 51.3962, -0.1934 | Al-Fatihah 1:5 | Maghrib | 2026-05-19 20:58 |
| Bilal Hussain, 29 | Software developer | Abu Bakr Mosque, Southall | 51.5070, -0.3770 | Ya-Sin 36:58 | Jumu'ah | 2026-09-25 13:45 |
| Khadija Benali, 33 | Primary teacher | Masjid Al-Tawhid, Leyton | 51.5640, -0.0110 | Al-Asr 103:1–2 | Sisters' circle | 2026-04-12 16:30 |
| Tariq Mahmood, 47 | Taxi driver | Tooting Islamic Centre | 51.4278, -0.1680 | Al-Baqarah 2:186 | Taraweeh | 2026-03-15 22:10 |
| Sumaya Patel, 24 | Junior doctor | Ilford Islamic Centre | 51.5590, 0.0790 | Az-Zumar 39:53 | Qiyam | 2026-03-26 02:15 |
| Musa Adeyemi, 41 | Electrician | Greenwich Islamic Centre, Woolwich | 51.4890, 0.0640 | Al-Ikhlas 112:1–4 | Fajr | 2026-10-10 05:58 |

For each reciter, write a one-line heritage note and three reflection answers (why this surah, favourite ayah, where they learned) in the warm, specific voice of the prototype. Example for Yusuf Rahman: *"I recite this after long night shifts. It is a promise I need to hear out loud."* Pull Arabic text and translation from the bundled Qur'an data, not from your memory.

## Build milestones

Build in this order. Stop after each one for review.

1. **Foundation** — Next.js + TypeScript + Tailwind project, design tokens, fonts, light/dark themes, header with Arabic wordmark and slogan, Listen and Map navigation. Linting, formatting and a CI workflow that runs tests.
2. **Qur'an data** — bundle surah list (names in Arabic and English, ayah counts) and Uthmani text plus translation as JSON. Write helpers `getSurah`, `getAyahRange`, `validateRange`, with unit tests.
3. **Database** — Supabase migrations for all tables, PostGIS, enums, RLS policies, the `mosques_with_counts` RPC, and the London seed. Generate TypeScript types from the schema.
4. **Listen** — player, waveform, random button, search and filters, persistent mini-player, Media Session controls. Reads approved recitations from the database.
5. **Map** — MapLibre map, bbox pin loading, clustering, mosque panel, reciter profile, qibla line, "Play" and "See on map" links in both directions.
6. **Detail pages** — recitation, reciter and mosque pages with Open Graph images.
7. **Auth and upload** — sign in, the six-step upload form with drafts, signed storage uploads, file checks, consent capture.
8. **Moderation** — admin queue, reports, mosque verification. Only approved items appear publicly.
9. **Polish and launch prep** — accessibility audit, performance (Lighthouse 90+ on mobile), empty and error states, privacy page, README with setup steps, deploy to Vercel.

## Rules and acceptance checklist

**Rules the agent must follow:**

- **Qur'an text integrity:** never type, generate or "fix" Arabic ayah text yourself. Always load it from the bundled source file, and credit the source (Tanzil) in the footer as its licence requires.
- **Privacy and consent:** pins go on mosques only, never on homes. Photos, names and ages show only with recorded consent. Reciters can ask for removal; add a "Request removal" link on every profile.
- **Safety:** nothing appears publicly until an admin approves it. Rate-limit uploads and reports. Check file type by content, not just extension.
- **Secrets:** keep keys in `.env.local`, provide `.env.example`, and never commit secrets.
- **No extra cost:** stay on free tiers. Ask before adding any paid service.
- **Honesty:** if a step fails or is skipped, say so in your milestone summary.

**Done means every box is ticked:**

- [ ] Random play works and never repeats the current recitation
- [ ] Search finds recitations by surah (English or Arabic), reciter, mosque and city
- [ ] Map shows all 12 London pins, clusters when zoomed out, and works with keyboard and touch
- [ ] Tapping a pin shows the reciter profile with reflections and a working Play button
- [ ] Arabic text renders right-to-left in the correct font and matches the source exactly
- [ ] Upload creates a pending recitation that appears publicly only after approval
- [ ] Signed-out users cannot write anything; RLS tests prove it
- [ ] Light and dark themes both pass WCAG AA contrast
- [ ] Works at 375px phone width with no horizontal scroll
- [ ] Vitest and Playwright suites pass in CI
- [ ] README explains local setup, seeding and deployment in under 10 steps
