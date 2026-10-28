import type { Metadata } from "next";
import { MapExplorer } from "@/components/map/MapExplorer";
import { getBuildRecitations } from "@/lib/buildData";
import type { MosqueWithCount } from "@/lib/database.types";

export const metadata: Metadata = {
  title: "Map",
  description: "Every mosque with recitations, on a world map. Tap a pin to meet the reciters.",
};

export default async function MapPage() {
  const initial = await getBuildRecitations();
  // What mosques_with_counts() returns for the opening world view, from the build snapshot.
  const byMosque = new Map<string, MosqueWithCount>();
  for (const { mosque: m } of initial) {
    const pin = byMosque.get(m.id);
    if (pin) pin.recitation_count++;
    else
      byMosque.set(m.id, {
        id: m.id,
        name: m.name,
        city: m.city,
        country: m.country,
        lat: m.lat,
        lng: m.lng,
        verified: true,
        recitation_count: 1,
      });
  }
  const initialVisible = [...byMosque.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <h1 className="sr-only">Map of mosques with recitations</h1>
      <MapExplorer initial={initial} initialVisible={initialVisible} />
    </>
  );
}
