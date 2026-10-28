import { apiRecitationsResponse } from "@/data/seed/api-fixture";
import { fetchApprovedRecitations, parseRecitations, type Recitation } from "./recitations";

/**
 * Approved recitations as of this build, for the pre-rendered detail pages.
 *   TADABBUR_BUILD_DATA=fixture  the London seed (CI and tests: deterministic, no database)
 *   otherwise                    live from Supabase with the public anon key (deploys)
 * A deploy with no Supabase config fails loudly rather than shipping empty pages.
 */
let cached: Promise<Recitation[]> | null = null;

export function getBuildRecitations() {
  cached ??=
    process.env.TADABBUR_BUILD_DATA === "fixture"
      ? Promise.resolve(parseRecitations(apiRecitationsResponse()))
      : fetchApprovedRecitations();
  return cached;
}

export async function getRecitation(id: string) {
  return (await getBuildRecitations()).find((r) => r.id === id) ?? null;
}

export async function getReciterRecitations(reciterId: string) {
  return (await getBuildRecitations()).filter((r) => r.reciter.id === reciterId);
}

export async function getMosqueRecitations(mosqueId: string) {
  return (await getBuildRecitations()).filter((r) => r.mosque.id === mosqueId);
}

export const unique = <T>(xs: T[]) => [...new Set(xs)];
