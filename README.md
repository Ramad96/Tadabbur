# Tadabbur · تَدَبُّر

_Hear the Qur'an in the voices of the living._ Recitations from people who pray in mosques around
the world, each pinned to the mosque where it was recorded, with a short profile of the reciter.

Live at **https://tadabbur.amanahdigital.co.uk**: a static Next.js site on GitHub Pages, reading
from Supabase (Postgres + PostGIS) in the browser. Row-level security is what keeps it safe.

## Run it locally

1. Install Node 22+ and pnpm 9, then `pnpm install`.
2. Copy `.env.example` to `.env.local` and fill in your Supabase project's URL and anon key
   (Project Settings → API).
3. In the Supabase SQL Editor, run each file in `supabase/migrations/` in order.
4. In Project Settings → Data API → Exposed schemas, add `tadabbur` and save.
5. Seed the London samples: run `supabase/seed.sql` in the SQL Editor (or `pnpm db:seed` with
   `SUPABASE_SERVICE_ROLE_KEY` set).
6. `pnpm db:check` confirms the live project is set up and that visitors can't write.
7. `pnpm dev` and open http://localhost:3000.

## Deploy

1. Repository → Settings → Secrets and variables → Actions → **Variables**: add
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Settings → Pages: Source **GitHub Actions**; custom domain `tadabbur.amanahdigital.co.uk`;
   tick **Enforce HTTPS** once the certificate is issued.
3. DNS for `amanahdigital.co.uk`: a `CNAME` record `tadabbur` → `<github-user>.github.io`.
4. Actions → **Deploy** → **Run workflow**. Deploys are manual: each run rebuilds every page and
   link-preview image from what is approved at that moment. A recitation approved since the last
   deploy still opens (it loads live), just without its preview image until the next run.

## Checks

| Command                                            | What it does                                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                        | Unit tests, plus database tests: the real migrations run in an in-memory Postgres (PGlite + PostGIS) and every RLS rule is exercised as a visitor, uploader and admin |
| `pnpm test:e2e`                                    | Playwright against the built site (`pnpm build` first), on desktop and a 375px phone, including WCAG 2.2 AA audits of every page in both themes                       |
| `pnpm lint`, `pnpm typecheck`, `pnpm format:check` | ESLint, TypeScript (strict), Prettier                                                                                                                                 |

CI runs all of them on every push. e2e builds use `TADABBUR_BUILD_DATA=fixture` (the London seed),
so they need no database or secrets.

## How it fits together

- `app/`: pages. Listen (`/`), Map (`/map/`), and pre-rendered detail pages `/r/[id]`,
  `/reciters/[id]` and `/mosques/[id]`. Upload is "coming soon"; moderation happens in Supabase.
- `components/`: the player (one `<audio>` in the layout, so playback survives navigation),
  map (MapLibre on free OpenFreeMap tiles), profiles and Arabic text.
- `lib/`: Qur'an helpers, search, data loading and geometry (qibla bearing).
- `data/quran/source/`: the Tanzil downloads, verbatim. `pnpm quran:build` derives
  `data/quran/surahs.json` and `public/quran/*.json`; a test proves every ayah is byte-identical.
- `supabase/`: migrations (everything in the `tadabbur` schema) and the London seed.
- `scripts/`: Qur'an data, seeding, link-preview images (`build-og.ts`), the MapLibre worker
  copy and the Amiri font subset.

## Rules this codebase keeps

- **Qur'an text** is never typed or altered: it is always read from the Tanzil source, rendered
  only in the Amiri font, and checked by tests. Credit to Tanzil is in the footer.
- **Privacy**: pins go on mosques, never homes. Names, ages and photos appear only with recorded
  consent, and every profile has a "Request removal" link.
- **Nothing is public until approved**: enforced by row-level security, not the UI.

## Before launch

The London data is fictional sample content. Remove it with
`delete from tadabbur.reciters where is_sample;` (recitations and reflections cascade).

## Credits and licences

Qur'an text: [Tanzil Project](https://tanzil.net) (CC BY 3.0, verbatim). Translation:
M. M. Pickthall (1930), public domain. Fonts: Amiri (OFL-1.1, subset; `app/fonts/Amiri-OFL.txt`),
Aref Ruqaa, Instrument Serif, IBM Plex. Map: OpenFreeMap, © OpenMapTiles, © OpenStreetMap contributors.
