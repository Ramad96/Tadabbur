import { expect, test } from "./test";

const TEXT = "This is dedicated to, and an idea that spawned from, Tagrid H. May Allah reward her.";

for (const path of ["/", "/map/", "/about/", "/r/00000000-0000-4000-8000-cccc00000001/"]) {
  test(`the dedication is in the source of ${path}, and nowhere on screen`, async ({ page, request }) => {
    // In the HTML as served (View Source) …
    expect(await (await request.get(path)).text()).toContain(`<!-- ${TEXT} -->`);
    // … and in the live DOM (the inspector), as a comment.
    await page.goto(path);
    const comments = await page.evaluate(() => {
      const found: string[] = [];
      const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT);
      while (walk.nextNode()) found.push(walk.currentNode.textContent!.trim());
      return found;
    });
    expect(comments).toContain(TEXT);
    // Never shown, never read out.
    await expect(page.getByText("Tagrid")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.innerText.includes("Tagrid"))).toBe(false);
  });
}
