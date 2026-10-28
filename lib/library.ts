import { surahSearchTerms } from "./quran/search";
import { getSurah } from "./quran/surahs";
import type { Recitation } from "./recitations";
import { matches } from "./search";

export type LibraryFilter = { query: string; surah: number | null; city: string | null };

/** Every string a recitation can be found by: surah (all name forms), reciter, mosque, city. */
export function recitationSearchTerms(r: Recitation) {
  const surah = getSurah(r.surah)!;
  return [
    ...surahSearchTerms(surah),
    r.reciter.name,
    r.mosque.name,
    r.mosque.address ?? "",
    r.mosque.city,
    r.mosque.country,
  ];
}

export function filterRecitations(list: Recitation[], f: LibraryFilter) {
  return list.filter(
    (r) =>
      (f.surah === null || r.surah === f.surah) &&
      (f.city === null || r.mosque.city === f.city) &&
      matches(f.query, recitationSearchTerms(r)),
  );
}

/** Surahs present in the list, in mushaf order, for the filter chips. */
export function surahsIn(list: Recitation[]) {
  return [...new Set(list.map((r) => r.surah))].sort((a, b) => a - b);
}

export function citiesIn(list: Recitation[]) {
  return [...new Set(list.map((r) => r.mosque.city))].sort();
}

/** A random recitation that is never the current one (unless it's the only one). */
export function pickRandom<T extends { id: string }>(
  list: T[],
  currentId: string | null,
  random: () => number = Math.random,
): T | null {
  if (list.length === 0) return null;
  const pool = list.length > 1 ? list.filter((r) => r.id !== currentId) : list;
  return pool[Math.floor(random() * pool.length)] ?? pool[0];
}

/** Decorative waveform for sample recitations (their audio is silence): stable per id. */
export function samplePeaks(id: string, bars = 120) {
  let s = 0;
  for (const c of id) s = (s * 31 + c.charCodeAt(0)) >>> 0;
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin(i / 9 + (s % 7)));
    out.push(Math.max(0.08, (s / 2 ** 32) * envelope));
  }
  return out;
}
