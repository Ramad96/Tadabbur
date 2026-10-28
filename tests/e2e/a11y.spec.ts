import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "./test";

const PAGES = [
  ["Listen", "/"],
  ["Map", "/map/"],
  ["Map with a mosque open", "/map/?mosque=00000000-0000-4000-8000-aaaa00000004"],
  ["Recitation", "/r/00000000-0000-4000-8000-cccc00000010/"],
  ["Reciter", "/reciters/00000000-0000-4000-8000-bbbb00000001/"],
  ["Mosque", "/mosques/00000000-0000-4000-8000-aaaa00000006/"],
  ["Upload (coming soon)", "/upload/"],
  ["Privacy", "/privacy/"],
  ["404", "/no-such-page/"],
] as const;

async function audit(page: Page) {
  // Let client data and fonts settle so the audit sees the real page, not a loading state.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.fonts.ready);
  return (
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      // The map canvas is WebGL; its tile labels aren't DOM text axe can judge.
      .exclude(".maplibregl-canvas")
      .analyze()
  );
}

for (const theme of ["dark", "light"] as const) {
  for (const [name, path] of PAGES) {
    test(`${name} (${theme}) has no WCAG 2.2 AA violations`, async ({ page }) => {
      await page.addInitScript(
        (t) => t === "light" && localStorage.setItem("tadabbur-theme", "light"),
        theme,
      );
      await page.goto(path);
      const { violations } = await audit(page);
      const summary = violations.map(
        (v) =>
          `${v.id}: ${v.help}\n  ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 5)
            .join("\n  ")}`,
      );
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
}
