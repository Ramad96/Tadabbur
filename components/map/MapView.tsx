"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSONSource, Map as MlMap, StyleSpecification } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import type { MosqueWithCount } from "@/lib/database.types";
import { clampBbox, qiblaLine } from "@/lib/geo";
import { HIDDEN_LAYERS, paintFor, readMapTokens } from "@/lib/mapTheme";
import { supabase } from "@/lib/supabase";

export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const WORLD = { center: [20, 25] as [number, number], zoom: 1.2 };
const LABEL = ["coalesce", ["get", "name:latin"], ["get", "name_en"], ["get", "name"]];

type Props = {
  selectedId: string | null;
  /** Where to start: a mosque to focus, else the world. */
  focus: { lng: number; lat: number } | null;
  showQibla: boolean;
  onSelect: (id: string | null) => void;
  /** Mosques with approved recitations inside the current view (for the keyboard-friendly list). */
  onVisible: (mosques: MosqueWithCount[]) => void;
};

/**
 * MapLibre map on free OpenFreeMap vector tiles, recoloured with the site tokens.
 * Pins load per bounding box from tadabbur.mosques_with_counts() as the view moves,
 * and cluster with a count when zoomed out.
 */
export function MapView({ selectedId, focus, showQibla, onSelect, onVisible }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MlMap | null>(null);
  const callbacks = useRef({ onSelect, onVisible });
  useEffect(() => {
    callbacks.current = { onSelect, onVisible };
  });
  const pins = useRef(new Map<string, MosqueWithCount>());
  const selectedRef = useRef(selectedId);
  // Bumped after each pin load so selection effects can see newly loaded mosques.
  const [pinsVersion, setPinsVersion] = useState(0);
  const [failed, setFailed] = useState(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let instance: MlMap | null = null;
    (async () => {
      const [maplibre, styleJson] = await Promise.all([
        import("maplibre-gl"),
        fetch(MAP_STYLE_URL).then((r) => r.json() as Promise<StyleSpecification>),
      ]);
      if (cancelled || !container.current) return;
      // The worker is copied into public/ at build time (scripts/copy-maplibre-worker.ts).
      maplibre.setWorkerUrl(`/vendor/maplibre-gl-worker.mjs?v=${maplibre.getVersion()}`);
      const tokens = readMapTokens();
      const style: StyleSpecification = {
        ...styleJson,
        layers: styleJson.layers
          .filter((l) => !HIDDEN_LAYERS.test(l.id))
          .map((l) => {
            const themed = { ...l, paint: { ...("paint" in l ? l.paint : {}), ...paintFor(l, tokens) } };
            // Latin names only: the dual-script labels made the world view fetch glyphs for a dozen
            // scripts (~600 KB) on first load.
            if (l.type === "symbol" && l.layout && "text-field" in l.layout) {
              Object.assign(themed, { layout: { ...l.layout, "text-field": LABEL } });
            }
            return themed as typeof l;
          }),
      };
      const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      instance = new maplibre.Map({
        container: container.current,
        style,
        center: focus ? [focus.lng, focus.lat] : WORLD.center,
        zoom: focus ? 14 : WORLD.zoom,
        // Added below at top-left, so the phone sheet over the map's lower edge never hides it.
        attributionControl: false,
        fadeDuration: reduceMotion ? 0 : 300,
      });
      instance.addControl(new maplibre.AttributionControl({ compact: true }), "top-left");
      instance.addControl(new maplibre.NavigationControl({ showCompass: false }), "top-right");
      instance.addControl(
        new maplibre.GeolocateControl({ fitBoundsOptions: { maxZoom: 10 }, trackUserLocation: false }),
        "top-right",
      );
      (container.current as HTMLDivElement & { __map?: MlMap }).__map = instance; // for e2e tests
      instance.on("load", () => !cancelled && setMap(instance));
    })().catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      instance?.remove();
    };
    // The starting view only matters on creation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sources, layers and interaction, once the style has loaded.
  useEffect(() => {
    if (!map) return;
    const t = () => getComputedStyle(document.documentElement);
    const lamp = t().getPropertyValue("--lamp").trim();
    const ink = t().getPropertyValue("--lamp-ink").trim();
    const bg = t().getPropertyValue("--bg").trim();
    const fg = t().getPropertyValue("--fg").trim();

    map.addSource("qibla", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: "qibla",
      type: "line",
      source: "qibla",
      paint: { "line-color": lamp, "line-width": 1.5, "line-opacity": 0.75, "line-dasharray": [2, 3] },
    });
    map.addSource("mosques", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterRadius: 48,
      clusterMaxZoom: 12,
    });
    map.addLayer({
      id: "clusters",
      type: "circle",
      source: "mosques",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": lamp,
        "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
        "circle-stroke-color": bg,
        "circle-stroke-width": 2,
      },
    });
    map.addLayer({
      id: "cluster-count",
      type: "symbol",
      source: "mosques",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
      },
      paint: { "text-color": ink },
    });
    map.addLayer({
      id: "pin-halo",
      type: "circle",
      source: "mosques",
      filter: ["!", ["has", "point_count"]],
      paint: { "circle-color": lamp, "circle-radius": 15, "circle-opacity": 0.18 },
    });
    map.addLayer({
      id: "pins",
      type: "circle",
      source: "mosques",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": ["case", ["==", ["get", "id"], ""], fg, lamp],
        "circle-radius": 7,
        "circle-stroke-color": bg,
        "circle-stroke-width": 2,
      },
    });

    const load = async () => {
      const b = map.getBounds();
      const box = clampBbox(b.getWest(), b.getSouth(), b.getEast(), b.getNorth());
      const { data } = (await supabase?.rpc("mosques_with_counts", box)) ?? {};
      if (!data) return;
      for (const m of data) pins.current.set(m.id, { ...m, recitation_count: Number(m.recitation_count) });
      (map.getSource("mosques") as GeoJSONSource | undefined)?.setData({
        type: "FeatureCollection",
        features: [...pins.current.values()].map((m) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [m.lng, m.lat] },
          properties: { id: m.id, name: m.name, count: m.recitation_count },
        })),
      });
      callbacks.current.onVisible(data.map((m) => ({ ...m, recitation_count: Number(m.recitation_count) })));
      setPinsVersion((v) => v + 1);
    };
    let timer: ReturnType<typeof setTimeout>;
    const onMove = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 200);
    };
    void load();
    map.on("moveend", onMove);

    map.on("click", "clusters", async (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const zoom = await (map.getSource("mosques") as GeoJSONSource).getClusterExpansionZoom(
        f.properties.cluster_id as number,
      );
      map.easeTo({ center: (f.geometry as { coordinates: [number, number] }).coordinates, zoom });
    });
    map.on("click", "pins", (e) => {
      const id = e.features?.[0]?.properties.id as string | undefined;
      if (id) callbacks.current.onSelect(id);
    });
    for (const layer of ["clusters", "pins"]) {
      map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
    }

    // Follow the site theme.
    const observer = new MutationObserver(() => {
      const tokens = readMapTokens();
      for (const layer of map.getStyle().layers) {
        for (const [prop, value] of Object.entries(paintFor(layer, tokens))) {
          // paintFor returns plain property names; MapLibre types them per layer kind.
          map.setPaintProperty(layer.id, prop as never, value as never);
        }
      }
      const css = t();
      const c = (n: string) => css.getPropertyValue(n).trim();
      map.setPaintProperty("qibla", "line-color", c("--lamp"));
      map.setPaintProperty("clusters", "circle-color", c("--lamp"));
      map.setPaintProperty("clusters", "circle-stroke-color", c("--bg"));
      map.setPaintProperty("cluster-count", "text-color", c("--lamp-ink"));
      map.setPaintProperty("pin-halo", "circle-color", c("--lamp"));
      map.setPaintProperty("pins", "circle-stroke-color", c("--bg"));
      map.setPaintProperty("pins", "circle-color", [
        "case",
        ["==", ["get", "id"], selectedRef.current ?? ""],
        c("--fg"),
        c("--lamp"),
      ]);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  // Selection: highlight the pin and draw the qibla line.
  useEffect(() => {
    selectedRef.current = selectedId;
    if (!map) return;
    const css = getComputedStyle(document.documentElement);
    map.setPaintProperty("pins", "circle-color", [
      "case",
      ["==", ["get", "id"], selectedId ?? ""],
      css.getPropertyValue("--fg").trim(),
      css.getPropertyValue("--lamp").trim(),
    ]);
    const m = selectedId ? pins.current.get(selectedId) : null;
    (map.getSource("qibla") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features:
        m && showQibla
          ? [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: qiblaLine(m.lat, m.lng) },
                properties: {},
              },
            ]
          : [],
    });
  }, [map, selectedId, showQibla, pinsVersion]);

  useEffect(() => {
    if (!map || !focus) return;
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    map[reduceMotion ? "jumpTo" : "flyTo"]({
      center: [focus.lng, focus.lat],
      zoom: Math.max(map.getZoom(), 13),
    });
  }, [map, focus]);

  if (failed) {
    return (
      <div role="alert" className="card text-muted grid h-full place-items-center p-6 text-center">
        The map couldn&rsquo;t load. Check your connection and refresh.
      </div>
    );
  }
  return (
    <div
      ref={container}
      data-testid="map"
      role="region"
      aria-label="Map of mosques with recitations. Use arrow keys to pan and plus or minus to zoom."
      className="h-full w-full"
    />
  );
}
