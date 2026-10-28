/**
 * Recolours OpenFreeMap's Positron style with the site's tokens, so the map sits in the same
 * night-prayer room (and its light twin). Pure: takes a layer, returns paint properties.
 */
export type MapTokens = {
  bg: string;
  land: string;
  landLine: string;
  water: string;
  road: string;
  muted: string;
  fg: string;
};

type Layer = { id: string; type: string };

export function readMapTokens(el: HTMLElement = document.documentElement): MapTokens {
  const css = getComputedStyle(el);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return {
    bg: v("--bg"),
    land: v("--land"),
    landLine: v("--land-line"),
    water: v("--water"),
    road: v("--road"),
    muted: v("--muted"),
    fg: v("--fg"),
  };
}

export function paintFor(layer: Layer, t: MapTokens): Record<string, unknown> {
  const { id, type } = layer;
  if (type === "background") return { "background-color": t.land };
  if (type === "fill") {
    if (id === "water") return { "fill-color": t.water };
    if (id === "building")
      return { "fill-color": t.road, "fill-opacity": 0.45, "fill-outline-color": t.road };
    if (/park|wood|landuse|landcover|aeroway|pier/.test(id))
      return { "fill-color": t.land, "fill-opacity": 1 };
    return {};
  }
  if (type === "line") {
    if (id.startsWith("waterway")) return { "line-color": t.water };
    if (id.startsWith("boundary")) return { "line-color": t.landLine };
    if (/casing/.test(id)) return { "line-color": t.landLine };
    if (/highway|road|tunnel|aeroway|railway/.test(id)) return { "line-color": t.road };
    return {};
  }
  if (type === "symbol") {
    const isWater = id.startsWith("water");
    return {
      "text-color": isWater ? t.landLine : t.muted,
      "text-halo-color": t.land,
      "text-halo-width": 1.2,
    };
  }
  return {};
}

/** Layers that add noise at this site's scale: shields, shaded relief and minor road names. */
export const HIDDEN_LAYERS = /shield|ne2_shaded|highway-name-path|highway-name-minor|airport|aeroway/;
