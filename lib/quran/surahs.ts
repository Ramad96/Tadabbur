import data from "@/data/quran/surahs.json";

export type Surah = {
  number: number;
  /** Simplified transliteration used across the UI, e.g. "Al-Fatihah". */
  name: string;
  /** Tanzil's transliteration, e.g. "Al-Faatiha". Kept for search. */
  tanzilName: string;
  arabic: string;
  english: string;
  ayahCount: number;
  revelationOrder: number;
  place: "Meccan" | "Medinan";
};

export const SURAHS = data.surahs as Surah[];

export function getSurah(n: number): Surah | undefined {
  return Number.isInteger(n) ? SURAHS[n - 1] : undefined;
}

export type RangeResult = { ok: true } | { ok: false; error: string };

/** Checks an ayah range against the surah's real length. */
export function validateRange(surah: number, start: number, end: number): RangeResult {
  const s = getSurah(surah);
  if (!s) return { ok: false, error: "Choose a surah between 1 and 114." };
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { ok: false, error: "Ayah numbers must be whole numbers." };
  }
  if (start < 1) return { ok: false, error: "The first ayah must be 1 or more." };
  if (end < start) return { ok: false, error: "The last ayah can't come before the first." };
  if (end > s.ayahCount) {
    return { ok: false, error: `Surah ${s.name} has ${s.ayahCount} ayahs.` };
  }
  return { ok: true };
}

/** "94:5–6", or "112:1" for a single ayah. */
export function formatRef(surah: number, start: number, end: number) {
  return start === end ? `${surah}:${start}` : `${surah}:${start}–${end}`;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function toArabicDigits(n: number) {
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/** U+06DD END OF AYAH followed by the number; Amiri draws the digits inside the marker. */
export function ayahMarker(n: number) {
  return `۝${toArabicDigits(n)}`;
}
