import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getAyahRange, type SurahFile } from "./text";

/** Build-time loader: reads the same JSON the browser fetches, straight from public/. */
export async function readSurahFile(surah: number): Promise<SurahFile> {
  const path = join(process.cwd(), "public/quran", `${String(surah).padStart(3, "0")}.json`);
  return JSON.parse(await readFile(path, "utf8")) as SurahFile;
}

export function getAyahRangeAtBuild(surah: number, start: number, end: number) {
  return getAyahRange(surah, start, end, readSurahFile);
}
