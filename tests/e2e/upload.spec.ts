import { expect, test } from "./test";

test("upload is presented as coming soon, with an email route in the meantime", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Footer" })
    .getByRole("link", { name: /Share a recitation/ })
    .click();
  await expect(page).toHaveURL(/\/upload\/$/);
  await expect(page.getByRole("heading", { level: 1, name: "Share a recitation" })).toBeVisible();
  await expect(page.getByText("Coming soon", { exact: true })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(6);
  await expect(page.getByRole("link", { name: "Email a recitation" })).toHaveAttribute(
    "href",
    /^mailto:amanahdigital1447@gmail\.com\?subject=A%20recitation%20for%20Tadabbur/,
  );
  // No form, no file input: nothing can be submitted without sign-in.
  await expect(page.locator("form, input[type=file]")).toHaveCount(0);
});
