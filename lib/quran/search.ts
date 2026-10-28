import { matches } from "@/lib/search";
import { SURAHS, type Surah } from "./surahs";

export function surahSearchTerms(s: Surah) {
  return [s.name, s.tanzilName, s.english, s.arabic, String(s.number)];
}

/** Surahs whose English, Tanzil or Arabic name (or number) matches the query. */
export function searchSurahs(query: string): Surah[] {
  const q = query.trim();
  if (/^\d+$/.test(q)) return SURAHS.filter((s) => s.number === Number(q));
  return SURAHS.filter((s) => matches(q, surahSearchTerms(s)));
}
