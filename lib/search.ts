/**
 * Search normalisation. Used only for matching, never for display: Qur'anic text
 * is always rendered exactly as it comes from the source.
 */

/** Lowercase, strip accents and punctuation, collapse doubled letters ("Faatiha" → "fatiha"). */
export function normalizeLatin(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/ai/g, "ay")
    .replace(/(.)\1+/g, "$1");
}

/** Strip harakat, Qur'anic annotation marks and tatweel; unify alef, ya and ta marbuta forms. */
export function normalizeArabic(s: string) {
  return s
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

const ARABIC_RE = /[؀-ۿ]/;

/** True when every word of the query appears in the haystack (in either script). */
export function matches(query: string, haystack: string[]) {
  const q = query.trim();
  if (!q) return true;
  if (ARABIC_RE.test(q)) {
    const hay = haystack.map(normalizeArabic).join(" ");
    return normalizeArabic(q)
      .split(" ")
      .every((w) => hay.includes(w));
  }
  const hay = haystack.map(normalizeLatin).join(" ");
  return q
    .split(/\s+/)
    .map(normalizeLatin)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}
