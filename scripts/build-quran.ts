/**
 * Derives the app's Qur'an JSON from the verbatim Tanzil downloads in data/quran/source.
 *
 *   data/quran/surahs.json   114 surahs: names, ayah counts, revelation place (small, bundled)
 *   public/quran/NNN.json    one file per surah: Arabic + translation (fetched on demand)
 *
 * Ayah text is copied byte-for-byte. The only split is the basmala that Tanzil prefixes
 * to ayah 1 of surahs 2–114 (not 9): it is stored in its own field, unchanged, so the
 * verse text matches Hafs numbering. tests/unit/quran-integrity.test.ts proves the round trip.
 *
 * Run: pnpm quran:build
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const src = (f: string) => readFileSync(join(root, "data/quran/source", f), "utf8");

// Simplified English transliterations for display and search. Tanzil's own spelling
// (e.g. "Al-Faatiha") is kept as `tanzilName` so both forms are searchable.
const NAMES = [
  "Al-Fatihah",
  "Al-Baqarah",
  "Ali Imran",
  "An-Nisa",
  "Al-Ma'idah",
  "Al-An'am",
  "Al-A'raf",
  "Al-Anfal",
  "At-Tawbah",
  "Yunus",
  "Hud",
  "Yusuf",
  "Ar-Ra'd",
  "Ibrahim",
  "Al-Hijr",
  "An-Nahl",
  "Al-Isra",
  "Al-Kahf",
  "Maryam",
  "Ta-Ha",
  "Al-Anbiya",
  "Al-Hajj",
  "Al-Mu'minun",
  "An-Nur",
  "Al-Furqan",
  "Ash-Shu'ara",
  "An-Naml",
  "Al-Qasas",
  "Al-Ankabut",
  "Ar-Rum",
  "Luqman",
  "As-Sajdah",
  "Al-Ahzab",
  "Saba",
  "Fatir",
  "Ya-Sin",
  "As-Saffat",
  "Sad",
  "Az-Zumar",
  "Ghafir",
  "Fussilat",
  "Ash-Shura",
  "Az-Zukhruf",
  "Ad-Dukhan",
  "Al-Jathiyah",
  "Al-Ahqaf",
  "Muhammad",
  "Al-Fath",
  "Al-Hujurat",
  "Qaf",
  "Adh-Dhariyat",
  "At-Tur",
  "An-Najm",
  "Al-Qamar",
  "Ar-Rahman",
  "Al-Waqi'ah",
  "Al-Hadid",
  "Al-Mujadilah",
  "Al-Hashr",
  "Al-Mumtahanah",
  "As-Saff",
  "Al-Jumu'ah",
  "Al-Munafiqun",
  "At-Taghabun",
  "At-Talaq",
  "At-Tahrim",
  "Al-Mulk",
  "Al-Qalam",
  "Al-Haqqah",
  "Al-Ma'arij",
  "Nuh",
  "Al-Jinn",
  "Al-Muzzammil",
  "Al-Muddaththir",
  "Al-Qiyamah",
  "Al-Insan",
  "Al-Mursalat",
  "An-Naba",
  "An-Nazi'at",
  "Abasa",
  "At-Takwir",
  "Al-Infitar",
  "Al-Mutaffifin",
  "Al-Inshiqaq",
  "Al-Buruj",
  "At-Tariq",
  "Al-A'la",
  "Al-Ghashiyah",
  "Al-Fajr",
  "Al-Balad",
  "Ash-Shams",
  "Al-Layl",
  "Ad-Duha",
  "Ash-Sharh",
  "At-Tin",
  "Al-Alaq",
  "Al-Qadr",
  "Al-Bayyinah",
  "Az-Zalzalah",
  "Al-Adiyat",
  "Al-Qari'ah",
  "At-Takathur",
  "Al-Asr",
  "Al-Humazah",
  "Al-Fil",
  "Quraysh",
  "Al-Ma'un",
  "Al-Kawthar",
  "Al-Kafirun",
  "An-Nasr",
  "Al-Masad",
  "Al-Ikhlas",
  "Al-Falaq",
  "An-Nas",
];

const NOTICE =
  "Tanzil Quran Text (Uthmani, Version 1.1). Copyright (C) 2007-2026 Tanzil Project. " +
  "License: Creative Commons Attribution 3.0. Verbatim copy; changing it is not allowed. " +
  "Source: https://tanzil.net. Translation: M. M. Pickthall (1930), public domain, via Tanzil.";

type Line = { surah: number; ayah: number; text: string };

function parseLines(file: string): Line[] {
  return src(file)
    .split("\n")
    .filter((l) => /^\d+\|\d+\|/.test(l))
    .map((l) => {
      const [s, a, ...rest] = l.split("|");
      return { surah: Number(s), ayah: Number(a), text: rest.join("|") };
    });
}

/** [start, ayas, order, rukus, name, tname, ename, type] from Tanzil's quran-data.js */
function parseMeta() {
  const js = src("quran-data.js");
  const block = js.slice(js.indexOf("QuranData.Sura = ["), js.indexOf("];", js.indexOf("QuranData.Sura")));
  const rows = [
    ...block.matchAll(/\[(\d+), (\d+), (\d+), (\d+), '([^']+)', "([^"]+)", '([^']+)', '(\w+)'\]/g),
  ];
  return rows.map((m) => ({
    ayahCount: Number(m[2]),
    revelationOrder: Number(m[3]),
    arabic: m[5],
    tanzilName: m[6],
    english: m[7],
    place: m[8] as "Meccan" | "Medinan",
  }));
}

/**
 * Tanzil prefixes the four-word basmala (sometimes with an assimilated shadda on the first
 * word) to ayah 1. Words are compared against 1:1 from the source, never typed by hand.
 */
function splitBasmala(surah: number, text: string, reference: string[]) {
  if (surah === 1 || surah === 9) return { basmala: null, text };
  const words = text.split(" ");
  if (words[1] !== reference[1] || words[2] !== reference[2] || words[3] !== reference[3]) {
    throw new Error(`Surah ${surah}: expected a basmala prefix on ayah 1`);
  }
  return { basmala: words.slice(0, 4).join(" "), text: words.slice(4).join(" ") };
}

const meta = parseMeta();
const arabic = parseLines("quran-uthmani.txt");
const english = parseLines("en.pickthall.txt");

if (meta.length !== 114) throw new Error(`Expected 114 surahs in metadata, got ${meta.length}`);
if (arabic.length !== 6236 || english.length !== 6236) throw new Error("Expected 6236 ayahs in each source");

const basmalaWords = arabic[0].text.split(" ");
const surahs = meta.map((m, i) => ({ number: i + 1, name: NAMES[i], ...m }));
writeFileSync(
  join(root, "data/quran/surahs.json"),
  JSON.stringify({ notice: NOTICE, surahs }, null, 1) + "\n",
);

mkdirSync(join(root, "public/quran"), { recursive: true });
for (const s of surahs) {
  const ar = arabic.filter((l) => l.surah === s.number);
  const en = english.filter((l) => l.surah === s.number);
  if (ar.length !== s.ayahCount || en.length !== s.ayahCount) {
    throw new Error(`Surah ${s.number}: ayah count mismatch`);
  }
  const first = splitBasmala(s.number, ar[0].text, basmalaWords);
  const ayahs = ar.map((l, i) => ({
    n: l.ayah,
    ar: i === 0 ? first.text : l.text,
    en: en[i].text,
  }));
  const file = { notice: NOTICE, surah: s.number, basmala: first.basmala, ayahs };
  writeFileSync(join(root, `public/quran/${String(s.number).padStart(3, "0")}.json`), JSON.stringify(file));
}

console.log(`Wrote data/quran/surahs.json and ${surahs.length} files in public/quran/`);
