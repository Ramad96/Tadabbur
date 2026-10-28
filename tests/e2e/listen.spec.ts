import type { Page } from "@playwright/test";
import surahs from "../../data/quran/surahs.json" with { type: "json" };
import { expect, test } from "./test";

const rows = (page: Page) =>
  page
    .getByRole("list")
    .filter({ has: page.getByRole("button") })
    .getByRole("listitem");
const stage = (page: Page) => page.getByRole("region", { name: "Now playing" });
const audio = (page: Page) => page.getByTestId("player-audio");
const currentReciter = (page: Page) => stage(page).locator('a[href^="/reciters/"]').textContent();
const isPlaying = (page: Page) => audio(page).evaluate((a: HTMLAudioElement) => !a.paused);

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(rows(page)).toHaveCount(12);
});

test("cues the newest recitation with its text, reciter and sample badge", async ({ page }) => {
  await expect(stage(page).getByText("Ready to play")).toBeVisible();
  await expect(stage(page).getByText("Musa Adeyemi", { exact: true })).toBeVisible();
  await expect(
    stage(page).getByText("Greenwich Islamic Centre, London · Fajr · 10 Oct 2026, 05:58"),
  ).toBeVisible();
  await expect(stage(page).getByText("Sample — audio coming soon")).toBeVisible();
  await expect(stage(page).getByRole("link", { name: /see on map/i })).toHaveAttribute(
    "href",
    "/map/?mosque=00000000-0000-4000-8000-aaaa00000012",
  );
});

test("search finds recitations by surah (English or Arabic), reciter, mosque and city", async ({ page }) => {
  const search = page.getByRole("searchbox", { name: "Search recitations" });
  const cases: [string, number][] = [
    ["mulk", 1],
    [surahs.surahs[54].arabic, 1], // Ar-Rahman, typed in Arabic
    ["tariq", 1],
    ["finsbury park", 1],
    ["london", 12],
    ["xylophone", 0],
  ];
  for (const [q, n] of cases) {
    await search.fill(q);
    await expect(rows(page), q).toHaveCount(n);
    if (n === 0) await expect(page.getByText(/No recitations match/)).toBeVisible();
  }
});

test("surah chips and the city filter narrow the list", async ({ page }) => {
  await page
    .getByRole("group", { name: "Filter by surah" })
    .getByRole("button", { name: "Al-Ikhlas" })
    .click();
  await expect(rows(page)).toHaveCount(2);
  await page.getByLabel("City").selectOption("London");
  await expect(rows(page)).toHaveCount(2);
  await page.getByRole("group", { name: "Filter by surah" }).getByRole("button", { name: "All" }).click();
  await expect(rows(page)).toHaveCount(12);
});

test("choosing a recitation plays it and marks it current", async ({ page }) => {
  await rows(page).filter({ hasText: "Al-Mulk" }).getByRole("button").click();
  await expect(stage(page).getByText("Hamza Siddiqui", { exact: true })).toBeVisible();
  await expect.poll(() => isPlaying(page)).toBe(true);
  await expect(stage(page).getByText("Now playing")).toBeVisible();
  await expect(rows(page).filter({ hasText: "Al-Mulk" }).getByRole("button")).toHaveAttribute(
    "aria-current",
    "true",
  );
  await stage(page).getByRole("button", { name: "Pause" }).click();
  await expect.poll(() => isPlaying(page)).toBe(false);
});

test("random never repeats the current recitation", async ({ page }) => {
  let previous = await currentReciter(page);
  for (let i = 0; i < 12; i++) {
    await stage(page).getByRole("button", { name: "Random" }).click();
    await expect.poll(() => currentReciter(page)).not.toBe(previous);
    previous = await currentReciter(page);
  }
});

test("previous and next step through the list", async ({ page }) => {
  const first = await currentReciter(page);
  await stage(page).getByRole("button", { name: "Next recitation" }).click();
  await expect.poll(() => currentReciter(page)).not.toBe(first);
  await stage(page).getByRole("button", { name: "Previous recitation" }).click();
  await expect.poll(() => currentReciter(page)).toBe(first);
});

test("speed and repeat apply to the audio", async ({ page }) => {
  await stage(page).getByLabel("Playback speed").selectOption("1.25");
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.playbackRate)).toBe(1.25);
  await stage(page).getByRole("button", { name: "Repeat" }).click();
  await expect(stage(page).getByRole("button", { name: "Repeat" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.loop)).toBe(true);
});

test("the play button works from the keyboard", async ({ page }) => {
  await stage(page).getByRole("button", { name: "Play" }).focus();
  await page.keyboard.press("Enter");
  await expect.poll(() => isPlaying(page)).toBe(true);
  await page.keyboard.press("Enter");
  await expect.poll(() => isPlaying(page)).toBe(false);
});

test("keeps playing across navigation, with a mini-player", async ({ page }) => {
  await stage(page).getByRole("button", { name: "Play" }).click();
  await expect.poll(() => isPlaying(page)).toBe(true);
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page).toHaveURL(/\/map\/$/);

  const mini = page.getByRole("region", { name: "Mini player" });
  await expect(mini).toBeVisible();
  await expect(mini.getByText("Musa Adeyemi · Greenwich Islamic Centre")).toBeVisible();
  expect(await isPlaying(page)).toBe(true);
  const t0 = await audio(page).evaluate((a: HTMLAudioElement) => a.currentTime);
  await expect.poll(() => audio(page).evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(t0);

  await mini.getByRole("button", { name: "Pause" }).click();
  await expect.poll(() => isPlaying(page)).toBe(false);
});

test("sets lock-screen metadata through the Media Session API", async ({ page }) => {
  await rows(page).filter({ hasText: "Ash-Sharh" }).getByRole("button").click();
  await expect
    .poll(() => page.evaluate(() => navigator.mediaSession.metadata?.title))
    .toBe("Ash-Sharh 94:5–6");
  expect(await page.evaluate(() => navigator.mediaSession.metadata?.artist)).toBe("Yusuf Rahman");
});

test("explains when audio can't load", async ({ page }) => {
  await page.route("**/audio/sample-silence.wav", (route) => route.fulfill({ status: 404 }));
  await page.goto("/");
  await stage(page).getByRole("button", { name: "Play" }).click();
  await expect(stage(page).getByRole("alert")).toContainText("couldn’t be loaded");
});

test("an empty catalogue says so, rather than 'no matches'", async ({ page }) => {
  await page.route("**/rest/v1/recitations*", (route) => route.fulfill({ json: [] }));
  // The page pre-renders the build snapshot; the live (empty) list replaces it.
  await page.goto("/");
  await expect(page.getByText("No recitations have been shared yet.")).toBeVisible();
});
