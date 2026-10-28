"use client";

import { useEffect, useState } from "react";
import { getAyahRange, type AyahRange } from "./quran/text";

// Ranges already known, e.g. rendered at build time and handed down, so the first render
// (and hydration) shows the text immediately instead of fetching it again.
const known = new Map<string, AyahRange>();
const keyOf = (surah: number, start: number, end: number) => `${surah}:${start}-${end}`;

export function primeAyahRanges(ranges: AyahRange[]) {
  for (const r of ranges) {
    if (r.ayahs.length) known.set(keyOf(r.surah, r.ayahs[0].n, r.ayahs.at(-1)!.n), r);
  }
}

/** Loads the exact source text for a range; null while loading (or if it fails). */
export function useAyahRange(surah: number, start: number, end: number) {
  const key = keyOf(surah, start, end);
  const [loaded, setLoaded] = useState<{ key: string; range: AyahRange } | null>(() => {
    const range = known.get(key);
    return range ? { key, range } : null;
  });
  useEffect(() => {
    if (known.has(key)) return;
    let live = true;
    getAyahRange(surah, start, end).then(
      (range) => {
        known.set(key, range);
        if (live) setLoaded({ key, range });
      },
      () => {},
    );
    return () => {
      live = false;
    };
  }, [surah, start, end, key]);
  if (loaded?.key === key) return loaded.range;
  return known.get(key) ?? null;
}
