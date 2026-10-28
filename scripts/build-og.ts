/**
 * Link-preview images (1200×630) for every pre-rendered recitation, plus a site default.
 * Runs after `next build`: reads out/build-data.json and writes out/og/r/<id>.png, out/og/site.png.
 *
 * Drawn by Chromium (via Playwright) rather than next/og, because next/og's renderer cannot shape
 * Arabic: it crashes or draws disconnected letters, which would misrepresent the Qur'an.
 * Ayah text comes verbatim from public/quran. Only whole ayahs are shown: if a passage is too
 * long for the card, trailing ayahs are dropped, never cut mid-ayah.
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const root = join(import.meta.dirname, "..");
const out = join(root, "out");

type Recitation = {
  id: string;
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  isSample: boolean;
  reciter: { name: string };
  mosque: { name: string; city: string };
};
type SurahFile = { ayahs: { n: number; ar: string }[] };
type SurahMeta = { number: number; name: string; arabic: string };

const { recitations } = JSON.parse(readFileSync(join(out, "build-data.json"), "utf8")) as {
  recitations: Recitation[];
};
const surahs = (
  JSON.parse(readFileSync(join(root, "data/quran/surahs.json"), "utf8")) as { surahs: SurahMeta[] }
).surahs;

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const arabicDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
const ref = (r: Recitation) =>
  r.ayahStart === r.ayahEnd ? `${r.surah}:${r.ayahStart}` : `${r.surah}:${r.ayahStart}–${r.ayahEnd}`;

const FONTS =
  "https://fonts.googleapis.com/css2?family=Amiri:wght@400&family=Aref+Ruqaa:wght@700&family=Instrument+Serif&family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@500&display=block";

const page = (body: string) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${FONTS}">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #0e1819; color: #ece6d8; font-family: "IBM Plex Sans", sans-serif;
         padding: 52px 64px; display: flex; flex-direction: column; overflow: hidden; }
  .top { display: flex; align-items: baseline; gap: 18px; }
  .mark { font-family: "Aref Ruqaa"; font-weight: 700; font-size: 64px; line-height: 1; color: #e2a64c; }
  .name { font-family: "Instrument Serif"; font-size: 34px; }
  .badge { margin-left: auto; align-self: center; border: 1px solid #2a3c3f; border-radius: 999px; padding: 6px 16px;
           font: 500 15px "IBM Plex Mono"; letter-spacing: .08em; text-transform: uppercase; color: #97a6a2; }
  .stage { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0; margin: 20px 0 16px; }
  .ayah { font-family: "Amiri"; direction: rtl; text-align: center; line-height: 1.85; max-width: 1060px; }
  .ayah .m { color: #e2a64c; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; border-top: 1px solid #2a3c3f; padding-top: 22px; }
  .who { font-family: "Instrument Serif"; font-size: 44px; line-height: 1.05; }
  .where { color: #97a6a2; font-size: 22px; margin-top: 6px; }
  .ref { font: 500 22px "IBM Plex Mono"; color: #e2a64c; text-align: right; white-space: nowrap; }
  .slogan { font-family: "Instrument Serif"; font-style: italic; font-size: 52px; text-align: center; color: #97a6a2; }
</style></head><body>${body}</body></html>`;

/** Fits the ayah block: shrink from 74px to 36px; then drop trailing ayahs; then fall back to the surah name. */
const FIT = `(() => {
  const stage = document.querySelector(".stage"), box = document.querySelector(".ayah");
  if (!box) return "none";
  const ayahs = [...box.querySelectorAll("[data-ayah]")];
  const fits = () => box.scrollHeight <= stage.clientHeight && box.scrollWidth <= stage.clientWidth;
  for (let keep = ayahs.length; keep >= 1; keep--) {
    ayahs.forEach((a, i) => (a.style.display = i < keep ? "" : "none"));
    for (let px = 74; px >= 36; px -= 2) { box.style.fontSize = px + "px"; if (fits()) return keep + "/" + ayahs.length + "@" + px; }
  }
  box.innerHTML = box.dataset.fallback; box.style.fontSize = "120px";
  return "fallback";
})()`;

function recitationCard(r: Recitation) {
  const s = surahs[r.surah - 1];
  const file = JSON.parse(
    readFileSync(join(root, `public/quran/${String(r.surah).padStart(3, "0")}.json`), "utf8"),
  ) as SurahFile;
  const ayahs = file.ayahs
    .slice(r.ayahStart - 1, r.ayahEnd)
    .map((a) => `<span data-ayah="${a.n}">${esc(a.ar)} <span class="m">۝${arabicDigits(a.n)}</span> </span>`)
    .join("");
  return page(`
    <div class="top"><span class="mark" lang="ar">تَدَبُّر</span><span class="name">Tadabbur</span>
      ${r.isSample ? `<span class="badge">Sample</span>` : ""}</div>
    <div class="stage"><div class="ayah" lang="ar" data-fallback="${esc(s.arabic)}">${ayahs}</div></div>
    <div class="bottom">
      <div><div class="who">${esc(r.reciter.name)}</div><div class="where">${esc(r.mosque.name)}, ${esc(r.mosque.city)}</div></div>
      <div class="ref">Surah ${esc(s.name)}<br>${ref(r)}</div>
    </div>`);
}

const siteCard = page(`
  <div class="top"><span class="mark" lang="ar" style="font-size:120px">تَدَبُّر</span><span class="name" style="font-size:56px">Tadabbur</span></div>
  <div class="stage"><p class="slogan">Hear the Qur’an in the voices of the living.</p></div>
  <div class="bottom"><div class="where">Recitations from people who pray in mosques around the world</div></div>`);

mkdirSync(join(out, "og/r"), { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });

async function render(html: string, file: string) {
  await tab.setContent(html, { waitUntil: "networkidle" });
  await tab.evaluate(() => document.fonts.ready);
  const fit = await tab.evaluate(FIT);
  await tab.screenshot({ path: join(out, file), type: "png" });
  return fit;
}

await render(siteCard, "og/site.png");
for (const r of recitations) {
  const fit = await render(recitationCard(r), `og/r/${r.id}.png`);
  console.log(`og/r/${r.id}.png  ${surahs[r.surah - 1].name} ${ref(r)}  (ayahs shown ${fit})`);
}
await browser.close();
console.log(`Wrote ${recitations.length + 1} preview images.`);
