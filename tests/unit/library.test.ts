import { describe, expect, it } from "vitest";
import { formatDuration, formatRecordedAt, hashString, initials, PRAYER_LABELS } from "@/lib/format";
import { citiesIn, filterRecitations, pickRandom, samplePeaks, surahsIn } from "@/lib/library";
import { getSurah } from "@/lib/quran/surahs";
import { parseRecitations } from "@/lib/recitations";
import { apiRecitationsResponse } from "../../data/seed/api-fixture";

const all = parseRecitations(apiRecitationsResponse());
const find = (query: string) =>
  filterRecitations(all, { query, surah: null, city: null }).map((r) => r.reciter.name);

describe("parseRecitations", () => {
  it("parses the API shape into app objects", () => {
    expect(all).toHaveLength(12);
    const yusuf = all.find((r) => r.reciter.name === "Yusuf Rahman")!;
    expect(yusuf).toMatchObject({ surah: 94, ayahStart: 5, ayahEnd: 6, prayer: "isha", isSample: true });
    expect(yusuf.mosque).toMatchObject({ name: "East London Mosque", timezone: "Europe/London" });
    expect(yusuf.reflections.find((f) => f.key === "favourite_ayah")?.favourite).toEqual({
      surah: 94,
      ayah: 5,
    });
  });

  it("rejects a malformed response instead of rendering it", () => {
    const bad = apiRecitationsResponse();
    (bad[0] as { surah: number }).surah = 115;
    expect(() => parseRecitations(bad)).toThrow();
  });
});

describe("search", () => {
  it("finds by surah in English, Tanzil spelling or meaning", () => {
    expect(find("mulk")).toEqual(["Hamza Siddiqui"]);
    expect(find("Ar-Rahmaan")).toEqual(["Ibrahim Al-Hashimi"]);
    expect(find("sincerity").sort()).toEqual(["Mehmet Yıldız", "Musa Adeyemi"]);
  });

  it("finds by surah in Arabic", () => {
    expect(find(getSurah(67)!.arabic)).toEqual(["Hamza Siddiqui"]);
  });

  it("finds by reciter, mosque, area and city", () => {
    expect(find("bilal")).toEqual(["Bilal Hussain"]);
    expect(find("brixton")).toEqual(["Amina Okafor"]);
    expect(find("whitechapel")).toEqual(["Yusuf Rahman"]);
    expect(find("london")).toHaveLength(12);
    expect(find("paris")).toEqual([]);
  });

  it("combines query, surah chip and city filters", () => {
    const ikhlas = filterRecitations(all, { query: "", surah: 112, city: "London" });
    expect(ikhlas.map((r) => r.reciter.name).sort()).toEqual(["Mehmet Yıldız", "Musa Adeyemi"]);
    expect(filterRecitations(all, { query: "musa", surah: 112, city: null })).toHaveLength(1);
    expect(filterRecitations(all, { query: "", surah: 112, city: "Paris" })).toHaveLength(0);
  });

  it("lists the surahs and cities present for the filters", () => {
    expect(surahsIn(all)).toEqual([1, 2, 13, 36, 39, 55, 67, 93, 94, 103, 112]);
    expect(citiesIn(all)).toEqual(["London"]);
  });
});

describe("pickRandom", () => {
  it("never returns the current recitation", () => {
    let current = all[0].id;
    for (let i = 0; i < 2000; i++) {
      const next = pickRandom(all, current)!;
      expect(next.id).not.toBe(current);
      current = next.id;
    }
  });

  it("reaches every other recitation", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 2000; i++) seen.add(pickRandom(all, all[0].id)!.id);
    expect(seen.size).toBe(11);
  });

  it("handles the edges, including a random() that returns 1", () => {
    expect(pickRandom([], null)).toBeNull();
    expect(pickRandom([all[0]], all[0].id)).toBe(all[0]);
    expect(pickRandom(all, all[0].id, () => 0.9999999)).not.toBe(all[0]);
  });
});

describe("formatting", () => {
  it("shows times in the mosque's own time zone", () => {
    expect(formatRecordedAt("2026-09-14T19:41:00.000Z", "Europe/London")).toBe("14 Sep 2026, 20:41");
    expect(formatRecordedAt("2026-03-26T02:15:00.000Z", "Europe/London")).toBe("26 Mar 2026, 02:15");
    expect(formatRecordedAt("2026-09-14T19:41:00.000Z", "Asia/Karachi")).toBe("15 Sep 2026, 00:41");
  });

  it("formats durations, initials, prayers and stable hashes", () => {
    expect(formatDuration(96)).toBe("1:36");
    expect(formatDuration(NaN)).toBe("0:00");
    expect(initials("Mehmet Yıldız")).toBe("MY");
    expect(PRAYER_LABELS.jumuah).toBe("Jumu’ah");
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(hashString("abc")).not.toBe(hashString("abd"));
  });

  it("makes a stable decorative waveform per recitation", () => {
    expect(samplePeaks("x")).toEqual(samplePeaks("x"));
    expect(samplePeaks("x")).not.toEqual(samplePeaks("y"));
    expect(samplePeaks("x").every((p) => p > 0 && p <= 1)).toBe(true);
  });
});
