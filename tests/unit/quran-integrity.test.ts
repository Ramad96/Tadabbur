/**
 * Proves the bundled Qur'an JSON is a verbatim derivative of the Tanzil downloads,
 * and that the downloads themselves have not been edited since they were fetched.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SURAHS } from "@/lib/quran/surahs";
import { readSurahFile } from "@/lib/quran/server";

const source = (f: string) => readFileSync(new URL(`../../data/quran/source/${f}`, import.meta.url));

const PINNED_SHA256 = {
  "quran-uthmani.txt": "7f30c647331a61100ebf24a80507dc0fcdd9f2df97f1312b5b2dfcb982a7f326",
  "en.pickthall.txt": "4aabbfa9d96796f5a6b0217d2c39dce1a3084f772bf6f2650e37082a774e3cc7",
  "quran-data.js": "9e9930c592aaa34b5c7a79ff4e99ffdc782263a266090bfe2c49e4ed4bac4ca4",
};

function lines(f: string) {
  const map = new Map<string, string>();
  for (const l of source(f).toString("utf8").split("\n")) {
    const m = /^(\d+)\|(\d+)\|(.*)$/.exec(l);
    if (m) map.set(`${m[1]}:${m[2]}`, m[3]);
  }
  return map;
}

describe("Qur'an source files", () => {
  it.each(Object.entries(PINNED_SHA256))("%s is unchanged since download", (file, hash) => {
    expect(createHash("sha256").update(source(file)).digest("hex")).toBe(hash);
  });
});

describe("bundled JSON matches the source exactly", () => {
  const arabic = lines("quran-uthmani.txt");
  const english = lines("en.pickthall.txt");

  it("source has 6236 ayahs in each file", () => {
    expect(arabic.size).toBe(6236);
    expect(english.size).toBe(6236);
  });

  it("every ayah's Arabic and translation are byte-identical to the source", async () => {
    let checked = 0;
    for (const s of SURAHS) {
      const file = await readSurahFile(s.number);
      expect(file.ayahs).toHaveLength(s.ayahCount);
      expect(file.notice).toContain("Tanzil");
      for (const a of file.ayahs) {
        const key = `${s.number}:${a.n}`;
        // Ayah 1 of most surahs carries Tanzil's basmala prefix; rejoining must restore the line.
        const ar = a.n === 1 && file.basmala ? `${file.basmala} ${a.ar}` : a.ar;
        expect(ar, key).toBe(arabic.get(key));
        expect(a.en, key).toBe(english.get(key));
        checked++;
      }
    }
    expect(checked).toBe(6236);
  });

  it("splits a basmala off every surah except 1 and 9", async () => {
    const reference = arabic.get("1:1")!;
    for (const s of SURAHS) {
      const { basmala } = await readSurahFile(s.number);
      if (s.number === 1 || s.number === 9) expect(basmala, String(s.number)).toBeNull();
      // Surahs 95 and 97 carry an assimilated shadda on the first word; the rest is identical.
      else expect(basmala!.split(" ").slice(1), String(s.number)).toEqual(reference.split(" ").slice(1));
    }
  });
});
