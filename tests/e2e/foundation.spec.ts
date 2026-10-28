import { expect, test } from "./test";

test("header shows the Arabic wordmark, slogan and navigation", async ({ page }) => {
  await page.goto("/");
  const mark = page.locator('header [lang="ar"]');
  await expect(mark).toHaveText("تَدَبُّر");
  await expect(mark).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("Hear the Qur’an in the voices of the living.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Listen", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("navigates between Listen and Map", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Map", exact: true }).click();
  await expect(page).toHaveURL(/\/map\/$/);
  await expect(page.getByRole("link", { name: "Map", exact: true })).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Listen", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("dark is the default and the light choice survives a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("button", { name: "Switch to dark theme" })).toBeVisible();
});

test("no horizontal scroll at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ["/", "/map/"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("skip link moves focus to main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});
