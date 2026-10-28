import { describe, expect, it } from "vitest";
import { searchSurahs } from "@/lib/quran/search";
import { readSurahFile } from "@/lib/quran/server";
import { SURAHS, ayahMarker, formatRef, getSurah, toArabicDigits, validateRange } from "@/lib/quran/surahs";
import { getAyahRange } from "@/lib/quran/text";
import { matches, normalizeArabic, normalizeLatin } from "@/lib/search";

describe("getSurah", () => {
  it("returns surah metadata by number", () => {
    expect(getSurah(1)).toMatchObject({ number: 1, name: "Al-Fatihah", ayahCount: 7, place: "Meccan" });
    expect(getSurah(2)?.ayahCount).toBe(286);
    expect(getSurah(114)).toMatchObject({ name: "An-Nas", ayahCount: 6 });
  });

  it("returns undefined outside 1–114 or for non-integers", () => {
    for (const n of [0, 115, -1, 1.5, NaN]) expect(getSurah(n)).toBeUndefined();
  });

  it("has 114 surahs totalling 6236 ayahs", () => {
    expect(SURAHS).toHaveLength(114);
    expect(SURAHS.reduce((t, s) => t + s.ayahCount, 0)).toBe(6236);
  });
});

describe("validateRange", () => {
  it("accepts ranges inside the surah", () => {
    expect(validateRange(94, 5, 6)).toEqual({ ok: true });
    expect(validateRange(2, 286, 286)).toEqual({ ok: true });
    expect(validateRange(112, 1, 4)).toEqual({ ok: true });
  });

  it.each([
    [0, 1, 1, "between 1 and 114"],
    [115, 1, 1, "between 1 and 114"],
    [1, 0, 3, "1 or more"],
    [1, 5, 3, "can't come before"],
    [1, 1, 8, "has 7 ayahs"],
    [112, 1, 5, "has 4 ayahs"],
    [1, 1.5, 2, "whole numbers"],
  ])("rejects %i:%s–%s", (surah, start, end, message) => {
    const r = validateRange(surah, start, end);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain(message);
  });
});

describe("getAyahRange", () => {
  const load = readSurahFile;

  it("returns the requested ayahs with translation", async () => {
    const r = await getAyahRange(94, 5, 6, load);
    expect(r.ayahs.map((a) => a.n)).toEqual([5, 6]);
    expect(r.ayahs[0].en).toMatch(/hardship/i);
    expect(r.basmala).toBeNull();
  });

  it("includes the basmala only when starting at ayah 1 of a surah that has one", async () => {
    expect((await getAyahRange(112, 1, 4, load)).basmala).toBeTruthy();
    expect((await getAyahRange(112, 2, 4, load)).basmala).toBeNull();
    expect((await getAyahRange(1, 1, 7, load)).basmala).toBeNull(); // 1:1 is itself the basmala
    expect((await getAyahRange(9, 1, 1, load)).basmala).toBeNull(); // At-Tawbah has none
  });

  it("rejects invalid ranges before loading anything", async () => {
    const never = () => Promise.reject(new Error("should not load"));
    await expect(getAyahRange(112, 1, 9, never)).rejects.toThrow(RangeError);
  });
});

describe("formatting", () => {
  it("formats references", () => {
    expect(formatRef(94, 5, 6)).toBe("94:5–6");
    expect(formatRef(112, 1, 1)).toBe("112:1");
  });

  it("uses Arabic-Indic digits in ayah markers", () => {
    expect(toArabicDigits(286)).toBe("٢٨٦");
    expect(ayahMarker(5)).toBe("۝٥");
  });
});

describe("search normalisation", () => {
  it("folds transliteration variants together", () => {
    expect(normalizeLatin("Al-Faatiha")).toBe(normalizeLatin("Al-Fatiha"));
    expect(normalizeLatin("Yaseen")).toBe(normalizeLatin("Ya-Sin"));
    expect(normalizeLatin("An-Noor")).toBe(normalizeLatin("An-Nur"));
    expect(normalizeLatin("Mehmet Yıldız")).toContain("mehmet");
  });

  it("strips harakat so a fully-voweled word matches the plain surah name", async () => {
    const voweled = (await readSurahFile(67)).ayahs[0].ar.split(" ")[3]; // the word al-mulk in 67:1
    expect(voweled).not.toBe(getSurah(67)!.arabic);
    expect(normalizeArabic(voweled)).toBe(normalizeArabic(getSurah(67)!.arabic));
  });

  it("requires every query word to match", () => {
    expect(matches("east london", ["East London Mosque", "Whitechapel"])).toBe(true);
    expect(matches("east brixton", ["East London Mosque", "Whitechapel"])).toBe(false);
    expect(matches("", ["anything"])).toBe(true);
  });
});

describe("searchSurahs", () => {
  const names = (q: string) => searchSurahs(q).map((s) => s.name);

  it("finds surahs by English, Tanzil or Arabic name, meaning or number", () => {
    expect(names("mulk")).toContain("Al-Mulk");
    expect(names("fatiha")).toEqual(["Al-Fatihah"]);
    expect(names("Yaseen")).toEqual(["Ya-Sin"]);
    expect(names("the opening")).toEqual(["Al-Fatihah"]);
    expect(names(getSurah(55)!.arabic)).toContain("Ar-Rahman");
    expect(names("112")).toEqual(["Al-Ikhlas"]);
  });
});
