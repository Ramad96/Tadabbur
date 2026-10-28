import { test as base, expect } from "@playwright/test";
import { apiRecitationsResponse } from "../../data/seed/api-fixture";

/** What tadabbur.mosques_with_counts(bbox) returns for the fixture data. */
function pinsIn(b: Record<string, number>) {
  const byMosque = new Map<
    string,
    ReturnType<typeof apiRecitationsResponse>[number]["mosque"] & { n: number }
  >();
  for (const r of apiRecitationsResponse()) {
    const m = byMosque.get(r.mosque.id) ?? { ...r.mosque, n: 0 };
    m.n++;
    byMosque.set(m.id, m);
  }
  return [...byMosque.values()]
    .filter((m) => m.lng >= b.min_lng && m.lng <= b.max_lng && m.lat >= b.min_lat && m.lat <= b.max_lat)
    .map((m) => ({
      id: m.id,
      name: m.name,
      city: m.city,
      country: m.country,
      lat: m.lat,
      lng: m.lng,
      verified: true,
      recitation_count: m.n,
    }));
}

/**
 * Every e2e test runs against fixture data instead of the live Supabase project:
 * the REST call for recitations returns the seed data, and play counts go nowhere.
 */
export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      await page.route("**/rest/v1/recitations*", (route) =>
        route.fulfill({ json: apiRecitationsResponse() }),
      );
      await page.route("**/rest/v1/rpc/record_play*", (route) => route.fulfill({ status: 204 }));
      await page.route("**/rest/v1/rpc/mosques_with_counts*", (route) => {
        const box = route.request().postDataJSON() as Record<string, number>;
        route.fulfill({ json: pinsIn(box) });
      });
      // A minimal map style: no tiles, so map tests run offline and fast.
      await page.route("https://tiles.openfreemap.org/styles/**", (route) =>
        route.fulfill({
          json: {
            version: 8,
            glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
            sources: {},
            layers: [{ id: "background", type: "background", paint: { "background-color": "#16252a" } }],
          },
        }),
      );
      await page.route("https://tiles.openfreemap.org/fonts/**", (route) =>
        route.fulfill({ status: 200, body: "" }),
      );
      await use();
    },
    { auto: true },
  ],
});

export { expect };
