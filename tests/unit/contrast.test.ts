import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/contrast";

const css = readFileSync(new URL("../../app/globals.css", import.meta.url), "utf8");

function tokens(selector: string) {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2]]));
}

const themes = { dark: tokens(":root"), light: tokens(':root[data-theme="light"]') };

// Text colours on every surface they appear on, at the WCAG AA normal-text threshold.
const pairs: [fg: string, bg: string][] = [
  ["fg", "bg"],
  ["fg", "panel"],
  ["fg", "raise"],
  ["muted", "bg"],
  ["muted", "panel"],
  ["muted", "raise"],
  ["lamp", "bg"],
  ["lamp", "panel"],
  ["lamp", "raise"],
  ["lamp-ink", "lamp"],
];

describe.each(Object.entries(themes))("%s theme", (_name, t) => {
  it("defines every token the pairs use", () => {
    for (const [fg, bg] of pairs) expect(t[fg] && t[bg], `${fg}/${bg}`).toBeTruthy();
  });

  it.each(pairs)("%s on %s meets 4.5:1", (fg, bg) => {
    expect(contrastRatio(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
