"use client";

import { primeAyahRanges } from "@/lib/useAyahRange";
import type { AyahRange } from "@/lib/quran/text";

/** Hands build-time ayah ranges to the client cache. Render it before the components that read them. */
export function PrimeAyahs({ ranges }: { ranges: AyahRange[] }) {
  primeAyahRanges(ranges); // idempotent, so safe during render
  return null;
}
