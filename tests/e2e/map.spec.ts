import type { Page } from "@playwright/test";
import { expect, test } from "./test";

const ELM = "00000000-0000-4000-8000-aaaa00000001";
const panel = (page: Page) => page.getByRole("complementary", { name: "Mosque details" });
const inView = (page: Page) => page.getByRole("list", { name: "Mosques in view" }).getByRole("button");

/** Runs code against the live MapLibre instance (exposed on its container for tests), once it exists. */
async function mapEval<T>(page: Page, fn: string): Promise<T> {
  const map = page.getByTestId("map");
  await map.evaluate(
    (el) =>
      new Promise<void>((resolve) => {
        const ready = () =>
          (el as unknown as { __map?: unknown }).__map ? resolve() : requestAnimationFrame(ready);
        ready();
      }),
  );
  return map.evaluate(
    (el, src) => new Function("map", `return (${src})`)((el as unknown as { __map: unknown }).__map),
    fn,
  ) as Promise<T>;
}

test("world view clusters the 12 London mosques into one counted pin", async ({ page }) => {
  await page.goto("/map/");
  await expect(inView(page)).toHaveCount(12);
  await expect
    .poll(() =>
      mapEval<number[]>(
        page,
        `map.querySourceFeatures("mosques").filter(f => f.properties.cluster).map(f => f.properties.point_count)`,
      ),
    )
    .toContainEqual(12);
});

test("across London every mosque is a pin or inside a cluster, and street zoom never clusters", async ({
  page,
}) => {
  await page.goto("/map/");
  await expect(inView(page)).toHaveCount(12);

  // All of Greater London in view: clusters + single pins account for exactly 12 mosques.
  await mapEval(page, `map.fitBounds([[-0.42, 51.38], [0.12, 51.6]], { duration: 0 })`);
  await expect
    .poll(() =>
      mapEval<number>(
        page,
        `(() => { const seen = new Map(); for (const f of map.querySourceFeatures("mosques")) {
           const key = f.properties.cluster ? "c" + f.properties.cluster_id : "p" + f.properties.id;
           seen.set(key, f.properties.cluster ? f.properties.point_count : 1); }
         return [...seen.values()].reduce((a, b) => a + b, 0); })()`,
      ),
    )
    .toBe(12);

  // Street level (past clusterMaxZoom 12): nothing clusters.
  await mapEval(page, `map.jumpTo({ center: [-0.06538, 51.51738], zoom: 14 })`);
  await expect
    .poll(() =>
      mapEval<number>(page, `map.querySourceFeatures("mosques").filter(f => f.properties.cluster).length`),
    )
    .toBe(0);
  await expect(inView(page).filter({ hasText: "East London Mosque" })).toBeVisible();
});

test("choosing a mosque shows its reciter, reflections, qibla and a working Play button", async ({
  page,
}) => {
  await page.goto("/map/");
  await inView(page).filter({ hasText: "Harrow Central Mosque" }).click();
  await expect(page).toHaveURL(/mosque=00000000-0000-4000-8000-aaaa00000004/);

  const p = panel(page);
  await expect(p.getByRole("heading", { name: "Harrow Central Mosque" })).toBeVisible();
  await expect(p.getByRole("heading", { name: "Hamza Siddiqui" })).toBeVisible();
  await expect(p.getByText("Why this surah?")).toBeVisible();
  await expect(p.getByText("My dad recites Al-Mulk every night.", { exact: false })).toBeVisible();
  await expect(p.getByText("Hifz completed at 15 at the local madrasah.")).toBeVisible();
  await expect(p.getByText("119° ESE")).toBeVisible();
  await expect(p.getByRole("link", { name: "Request removal" })).toBeVisible();

  // The favourite ayah is rendered from the bundled source, not stored text.
  const source = await (await page.request.get("/quran/067.json")).json();
  await expect(p.locator('[data-ayah="2"]')).toHaveText(source.ayahs[1].ar);

  // The qibla line is drawn from the selected mosque.
  await expect
    .poll(() => mapEval<number>(page, `map.querySourceFeatures("qibla").length`))
    .toBeGreaterThan(0);

  await p.getByRole("button", { name: "Play this recitation" }).click();
  await expect
    .poll(() => page.getByTestId("player-audio").evaluate((a: HTMLAudioElement) => !a.paused))
    .toBe(true);
  await expect(page.getByRole("region", { name: "Mini player" })).toContainText("Hamza Siddiqui");
});

test("“See on map” from Listen focuses that mosque, and works back again", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("list", { name: "Recitations" })
    .getByRole("button")
    .filter({ hasText: "Ash-Sharh" })
    .click();
  await page
    .getByRole("region", { name: "Now playing" })
    .getByRole("link", { name: /see on map/i })
    .click();

  await expect(page).toHaveURL(new RegExp(`/map/\\?mosque=${ELM}`));
  await expect(panel(page).getByRole("heading", { name: "East London Mosque" })).toBeVisible();
  await expect(panel(page).getByRole("heading", { name: "Yusuf Rahman" })).toBeVisible();
  await expect.poll(() => mapEval<number>(page, "map.getZoom()")).toBeGreaterThan(12);
  // Still playing what was chosen on Listen.
  await expect(page.getByRole("region", { name: "Mini player" })).toContainText("Yusuf Rahman");
});

test("works from the keyboard: map focus, mosque list, close", async ({ page }) => {
  await page.goto("/map/");
  await expect(inView(page)).toHaveCount(12);

  const canvas = page.locator(".maplibregl-canvas");
  await canvas.focus();
  const z0 = await mapEval<number>(page, "map.getZoom()");
  await page.keyboard.press("Equal"); // "+" zooms in
  await expect.poll(() => mapEval<number>(page, "map.getZoom()")).toBeGreaterThan(z0);

  await inView(page).filter({ hasText: "Brixton Mosque" }).focus();
  await page.keyboard.press("Enter");
  await expect(panel(page).getByRole("heading", { name: "Amina Okafor" })).toBeVisible();
  await panel(page).getByRole("button", { name: "Close mosque" }).press("Enter");
  await expect(inView(page)).toHaveCount(12);
});

test("no horizontal scroll on a phone with a mosque open", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`/map/?mosque=${ELM}`);
  await expect(panel(page).getByRole("heading", { name: "Yusuf Rahman" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
