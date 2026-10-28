import { describe, expect, it } from "vitest";
import { KAABA, clampBbox, compassPoint, qiblaBearing, qiblaLine } from "@/lib/geo";
import { paintFor, type MapTokens } from "@/lib/mapTheme";

describe("qiblaBearing", () => {
  // Reference bearings from standard great-circle qibla tables.
  it.each([
    ["London", 51.5072, -0.1276, 118.99],
    ["New York", 40.7128, -74.006, 58.48],
    ["Jakarta", -6.2088, 106.8456, 295.15],
    ["Cape Town", -33.9249, 18.4241, 23.0],
    ["Karachi", 24.8607, 67.0011, 267.5],
  ])("%s", (_city, lat, lng, expected) => {
    expect(qiblaBearing(lat, lng)).toBeCloseTo(expected, 0);
  });

  it("names the compass point", () => {
    expect(compassPoint(qiblaBearing(51.5072, -0.1276))).toBe("ESE");
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(359)).toBe("N");
  });
});

describe("qiblaLine", () => {
  it("runs from the mosque to the Ka'bah", () => {
    const line = qiblaLine(51.51738, -0.06538);
    expect(line[0][0]).toBeCloseTo(-0.06538, 6);
    expect(line[0][1]).toBeCloseTo(51.51738, 6);
    expect(line.at(-1)![0]).toBeCloseTo(KAABA.lng, 6);
    expect(line.at(-1)![1]).toBeCloseTo(KAABA.lat, 6);
    expect(line).toHaveLength(65);
  });

  it("follows the great circle (bows north of the straight Mercator line from London)", () => {
    const line = qiblaLine(51.5, -0.12);
    const mid = line[32];
    const straightLatAtMidLng = 51.5 + ((mid[0] + 0.12) / (KAABA.lng + 0.12)) * (KAABA.lat - 51.5);
    expect(mid[1]).toBeGreaterThan(straightLatAtMidLng);
  });
});

describe("clampBbox", () => {
  it("clamps a scrolled-past-the-antimeridian view to the world", () => {
    expect(clampBbox(-250, -95, 250, 95)).toEqual({ min_lng: -180, min_lat: -90, max_lng: 180, max_lat: 90 });
    expect(clampBbox(-0.6, 51.2, 0.3, 51.7)).toEqual({
      min_lng: -0.6,
      min_lat: 51.2,
      max_lng: 0.3,
      max_lat: 51.7,
    });
  });
});

describe("paintFor", () => {
  const t: MapTokens = {
    bg: "#0",
    land: "#1",
    landLine: "#2",
    water: "#3",
    road: "#4",
    muted: "#5",
    fg: "#6",
  };
  it("maps Positron layers onto the tokens", () => {
    expect(paintFor({ id: "background", type: "background" }, t)).toEqual({ "background-color": "#1" });
    expect(paintFor({ id: "water", type: "fill" }, t)).toEqual({ "fill-color": "#3" });
    expect(paintFor({ id: "waterway", type: "line" }, t)).toEqual({ "line-color": "#3" });
    expect(paintFor({ id: "highway_major_inner", type: "line" }, t)).toEqual({ "line-color": "#4" });
    expect(paintFor({ id: "highway_major_casing", type: "line" }, t)).toEqual({ "line-color": "#2" });
    expect(paintFor({ id: "label_city", type: "symbol" }, t)).toMatchObject({
      "text-color": "#5",
      "text-halo-color": "#1",
    });
  });
});
