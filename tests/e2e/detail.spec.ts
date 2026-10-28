import { apiRecitationsResponse } from "../../data/seed/api-fixture";
import { expect, test } from "./test";

const YUSUF = "00000000-0000-4000-8000-cccc00000001";
const YUSUF_RECITER = "00000000-0000-4000-8000-bbbb00000001";
const ELM = "00000000-0000-4000-8000-aaaa00000001";
const SITE = "https://tadabbur.amanahdigital.co.uk";

test("a recitation has its own shareable page with the exact ayah text and a preview image", async ({
  page,
  request,
}) => {
  await page.goto(`/r/${YUSUF}/`);
  await expect(page).toHaveTitle("Ash-Sharh 94:5–6, recited by Yusuf Rahman · Tadabbur");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Surah Ash-Sharh 94:5–6");

  const source = await (await request.get("/quran/094.json")).json();
  const main = page.locator("main .ayah").first();
  await expect(main.locator('[data-ayah="5"]')).toHaveText(source.ayahs[4].ar);
  await expect(main.locator('[data-ayah="6"]')).toHaveText(source.ayahs[5].ar);

  const og = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(og).toBe(`${SITE}/og/r/${YUSUF}.png`);
  expect(await page.locator('meta[name="twitter:card"]').getAttribute("content")).toBe("summary_large_image");
  const img = await request.get(`/og/r/${YUSUF}.png`);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/png");
  expect((await img.body()).byteLength).toBeGreaterThan(10_000);
});

test("Play on a recitation page starts the player", async ({ page }) => {
  await page.goto(`/r/${YUSUF}/`);
  await page.getByRole("button", { name: "Play this recitation" }).click();
  await expect
    .poll(() => page.getByTestId("player-audio").evaluate((a: HTMLAudioElement) => !a.paused))
    .toBe(true);
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page.getByRole("region", { name: "Mini player" })).toContainText("Yusuf Rahman");
});

test("reciter and mosque pages list their recitations and link onwards", async ({ page }) => {
  await page.goto(`/reciters/${YUSUF_RECITER}/`);
  await expect(page.getByRole("heading", { level: 1, name: "Yusuf Rahman" })).toBeVisible();
  await expect(page.getByText("Born in Tower Hamlets, family from Sylhet")).toBeVisible();
  await expect(page.getByRole("link", { name: "Request removal" })).toHaveAttribute(
    "href",
    /^mailto:amanahdigital1447@gmail\.com\?subject=Removal%20request%3A%20Yusuf%20Rahman/,
  );

  await page.getByRole("link", { name: /Ash-Sharh 94:5–6/ }).click();
  await expect(page).toHaveURL(new RegExp(`/r/${YUSUF}/$`));
  await page.getByRole("link", { name: "East London Mosque", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/mosques/${ELM}/$`));
  await expect(page.getByRole("heading", { level: 1, name: "East London Mosque" })).toBeVisible();
  await expect(page.getByText("119° ESE")).toBeVisible();
  await expect(page.getByRole("link", { name: "eastlondonmosque.org.uk" })).toBeVisible();
});

test("Listen links through to reciter and recitation pages", async ({ page }) => {
  await page.goto("/");
  const stage = page.getByRole("region", { name: "Now playing" });
  await stage.getByRole("link", { name: "Musa Adeyemi" }).click();
  await expect(page).toHaveURL(/\/reciters\/00000000-0000-4000-8000-bbbb00000012\/$/);
});

test("a recitation approved after the last build still opens, loaded live", async ({ page }) => {
  const NEW = "00000000-0000-4000-8000-eeee00000001";
  const extra = { ...apiRecitationsResponse()[0], id: NEW, surah: 1, ayah_start: 1, ayah_end: 7 };
  await page.route("**/rest/v1/recitations*", (route) =>
    route.fulfill({ json: [extra, ...apiRecitationsResponse()] }),
  );
  await page.goto(`/r/${NEW}/`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Surah Al-Fatihah 1:1–7");
  await expect(page.locator("main .ayah").first().locator("[data-ayah]")).toHaveCount(7);
  await expect(page.getByText("Newly added")).toBeVisible();
});

test("an unknown page is a real 404", async ({ page }) => {
  await page.goto(`/r/00000000-0000-4000-8000-ffffffffffff/`);
  await expect(page.getByRole("heading", { name: "This page is not here" })).toBeVisible();
  await page.goto("/no-such-page/");
  await expect(page.getByRole("heading", { name: "This page is not here" })).toBeVisible();
});
