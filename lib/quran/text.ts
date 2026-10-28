import { validateRange } from "./surahs";

export type Ayah = { n: number; ar: string; en: string };
export type SurahFile = { notice: string; surah: number; basmala: string | null; ayahs: Ayah[] };
export type AyahRange = { surah: number; basmala: string | null; ayahs: Ayah[] };
export type SurahLoader = (surah: number) => Promise<SurahFile>;

const cache = new Map<number, Promise<SurahFile>>();

/** Browser loader: fetches /quran/NNN.json once per surah. */
export const fetchSurahFile: SurahLoader = (surah) => {
  let p = cache.get(surah);
  if (!p) {
    p = fetch(`/quran/${String(surah).padStart(3, "0")}.json`).then((r) => {
      if (!r.ok) throw new Error(`Could not load surah ${surah}`);
      return r.json() as Promise<SurahFile>;
    });
    p.catch(() => cache.delete(surah));
    cache.set(surah, p);
  }
  return p;
};

/**
 * The ayahs from start to end inclusive, exactly as in the source. The basmala is
 * included only when the range starts at ayah 1 of a surah that has one.
 */
export async function getAyahRange(
  surah: number,
  start: number,
  end: number,
  load: SurahLoader = fetchSurahFile,
): Promise<AyahRange> {
  const check = validateRange(surah, start, end);
  if (!check.ok) throw new RangeError(check.error);
  const file = await load(surah);
  return {
    surah,
    basmala: start === 1 ? file.basmala : null,
    ayahs: file.ayahs.slice(start - 1, end),
  };
}
