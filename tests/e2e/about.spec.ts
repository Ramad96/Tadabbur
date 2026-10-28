import type { Page } from "@playwright/test";
import { expect, test } from "./test";

const sheet = (page: Page) => page.getByRole("dialog", { name: "About us" });
const trigger = (page: Page) => page.getByRole("banner").getByRole("link", { name: "About us" });

async function openSheet(page: Page) {
  await page.goto("/");
  await trigger(page).click();
  await expect(sheet(page)).toBeVisible();
}

test("“About us” in the header opens the sheet with three titled sections", async ({ page, request }) => {
  await openSheet(page);
  await expect(page).toHaveURL(/\/$/); // opened in place, not navigated
  const headings = sheet(page).getByRole("heading", { level: 2 });
  await expect(headings).toHaveText(["About Tadabbur", "AmanahDigital", "Dua"]);

  // Pull quote (38:29) and dua (3:8) are the exact source ayahs.
  const sad = await (await request.get("/quran/038.json")).json();
  const imran = await (await request.get("/quran/003.json")).json();
  await expect(sheet(page).locator('[data-ayah="29"]')).toHaveText(sad.ayahs[28].ar);
  await expect(sheet(page).locator('[data-ayah="8"]')).toHaveText(imran.ayahs[7].ar);
  await expect(sheet(page).getByText(sad.ayahs[28].en, { exact: false })).toBeVisible();
  await expect(sheet(page).getByText(imran.ayahs[7].en, { exact: false })).toBeVisible();

  const site = sheet(page).getByRole("link", { name: /amanahdigital\.co\.uk/ });
  await expect(site).toHaveAttribute("href", "https://amanahdigital.co.uk");
  await expect(site).toHaveAttribute("target", "_blank");
});

test("closes with the X, Escape and a click outside, returning focus to the link", async ({ page }) => {
  await openSheet(page);
  await sheet(page).getByRole("button", { name: "Close" }).click();
  await expect(sheet(page)).toBeHidden();
  await expect(trigger(page)).toBeFocused();

  await trigger(page).click();
  await page.keyboard.press("Escape");
  await expect(sheet(page)).toBeHidden();

  await trigger(page).click();
  await page.mouse.click(5, 5); // the backdrop
  await expect(sheet(page)).toBeHidden();
});

test("swiping down closes the sheet on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "touch gesture");
  await openSheet(page);
  const handle = sheet(page).locator("[data-handle]");
  const box = (await handle.boundingBox())!;
  const at = (y: number) => ({ pointerType: "touch", clientX: box.x + 20, clientY: y, bubbles: true });
  await handle.dispatchEvent("pointerdown", at(box.y));
  await handle.dispatchEvent("pointermove", at(box.y + 160));
  await handle.dispatchEvent("pointerup", at(box.y + 160));
  await expect(sheet(page)).toBeHidden();
});

test("titled dividers: centred label, a line either side, announced as headings", async ({ page }) => {
  await openSheet(page);
  const divider = sheet(page).getByRole("heading", { name: "About Tadabbur" });
  const lines = await divider.evaluate((el) => {
    const w = (p: string) => parseFloat(getComputedStyle(el, p).width);
    return { before: w("::before"), after: w("::after"), transform: getComputedStyle(el).textTransform };
  });
  expect(lines.before).toBeGreaterThanOrEqual(24);
  expect(Math.abs(lines.before - lines.after)).toBeLessThan(2); // label centred
  expect(lines.transform).toBe("uppercase");
});

test("/about/ is a page of its own, and the footer links to it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Footer" }).getByRole("link", { name: "About us" }).click();
  await expect(page).toHaveURL(/\/about\/$/);
  await expect(page).toHaveTitle("About us · Tadabbur");
  await expect(page.getByRole("main").getByRole("heading", { level: 2 })).toHaveText([
    "About Tadabbur",
    "AmanahDigital",
    "Dua",
  ]);
});
