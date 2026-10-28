import { expect, test } from "./test";

test("rendered Arabic matches the bundled source exactly and flows right-to-left", async ({
  page,
  request,
}) => {
  await page.goto("/");
  // The newest sample (Al-Ikhlas 112:1–4) is cued on first visit.
  const block = page.locator('[lang="ar"][dir="rtl"].ayah').first();
  await expect(block.locator('[data-ayah="4"]')).toBeVisible();
  const source = await (await request.get("/quran/112.json")).json();

  for (const n of [1, 2, 3, 4]) {
    expect(await block.locator(`[data-ayah="${n}"]`).textContent()).toBe(source.ayahs[n - 1].ar);
  }
  expect(await block.locator("[data-basmala]").textContent()).toBe(source.basmala);

  const style = await block.evaluate((el) => {
    const s = getComputedStyle(el);
    return { direction: s.direction, font: s.fontFamily, transform: s.textTransform };
  });
  expect(style.direction).toBe("rtl");
  expect(style.font).toMatch(/amiri/i);
  expect(style.transform).toBe("none");
});
