/** The Ka'bah, Makkah. */
export const KAABA = { lat: 21.422487, lng: 39.826206 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Initial great-circle bearing from a point to the Ka'bah, in degrees clockwise from true north. */
export function qiblaBearing(lat: number, lng: number) {
  const φ1 = rad(lat);
  const φ2 = rad(KAABA.lat);
  const Δλ = rad(KAABA.lng - lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Points along the great circle from a point to the Ka'bah, as [lng, lat] for GeoJSON.
 * A web map draws straight segments in Mercator, so the curve needs intermediate points.
 */
export function qiblaLine(lat: number, lng: number, steps = 64): [number, number][] {
  const toVec = (la: number, lo: number) => [
    Math.cos(rad(la)) * Math.cos(rad(lo)),
    Math.cos(rad(la)) * Math.sin(rad(lo)),
    Math.sin(rad(la)),
  ];
  const a = toVec(lat, lng);
  const b = toVec(KAABA.lat, KAABA.lng);
  const ω = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  if (ω < 1e-9) return [[lng, lat]];
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const k1 = Math.sin((1 - t) * ω) / Math.sin(ω);
    const k2 = Math.sin(t * ω) / Math.sin(ω);
    const v = [0, 1, 2].map((j) => k1 * a[j] + k2 * b[j]);
    points.push([deg(Math.atan2(v[1], v[0])), deg(Math.atan2(v[2], Math.hypot(v[0], v[1])))]);
  }
  return points;
}

/** "SE", "WNW"… for a bearing. */
export function compassPoint(bearing: number) {
  const names = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  return names[Math.round(bearing / 22.5) % 16];
}

export type Bbox = { min_lng: number; min_lat: number; max_lng: number; max_lat: number };

/** A map view's bounds, clamped to the world (the map can scroll past ±180°). */
export function clampBbox(west: number, south: number, east: number, north: number): Bbox {
  const wide = east - west >= 360;
  return {
    min_lng: wide ? -180 : Math.max(-180, west),
    min_lat: Math.max(-90, south),
    max_lng: wide ? 180 : Math.min(180, east),
    max_lat: Math.min(90, north),
  };
}
