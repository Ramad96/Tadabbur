"use client";

import { useCallback, useMemo, useState } from "react";
import { ReciterProfile } from "@/components/ReciterProfile";
import { StarAvatar } from "@/components/StarAvatar";
import type { MosqueWithCount } from "@/lib/database.types";
import type { Recitation } from "@/lib/recitations";
import { compassPoint, qiblaBearing } from "@/lib/geo";
import { PRAYER_LABELS } from "@/lib/format";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import { useQueryParams } from "@/lib/useQueryParams";
import { useRecitations } from "@/lib/useRecitations";
import { MapView } from "./MapView";

/**
 * The Map page: the map plus a panel (side panel on desktop, a sheet over the map's lower edge
 * on phones). Selection lives in the URL (?mosque=…&r=…) so "See on map" links and shares work.
 */
export function MapExplorer({
  initial,
  initialVisible = [],
}: {
  initial?: Recitation[];
  /** Pins for the opening world view, pre-rendered so the panel arrives with content. */
  initialVisible?: MosqueWithCount[];
}) {
  const [params, replaceParams] = useQueryParams();
  const state = useRecitations(initial);
  const all = useMemo(() => (state.status === "ready" ? state.recitations : []), [state]);

  const mosqueId = params.get("mosque");
  const recitationId = params.get("r");
  const [visible, setVisible] = useState<MosqueWithCount[]>(initialVisible);
  const [showQibla, setShowQibla] = useState(true);

  const atMosque = useMemo(() => all.filter((r) => r.mosque.id === mosqueId), [all, mosqueId]);
  const mosque = atMosque[0]?.mosque ?? null;
  const selected =
    atMosque.find((r) => r.id === recitationId) ?? (atMosque.length === 1 ? atMosque[0] : null);

  // The mosque named in the URL, located from the recitation data once it arrives.
  const focus = useMemo(() => (mosque ? { lng: mosque.lng, lat: mosque.lat } : null), [mosque]);

  const go = useCallback(
    (mosque: string | null, r?: string | null) => replaceParams({ mosque, r: mosque ? (r ?? null) : null }),
    [replaceParams],
  );

  const bearing = mosque ? qiblaBearing(mosque.lat, mosque.lng) : 0;

  return (
    <div className="grid gap-0 pt-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:gap-6">
      <div className="border-line bg-water relative h-[62vh] min-h-[360px] overflow-hidden rounded-[14px] border md:h-[640px]">
        <MapView
          selectedId={mosqueId}
          focus={focus}
          showQibla={showQibla}
          onSelect={(id) => go(id)}
          onVisible={setVisible}
        />
      </div>

      <aside
        aria-label="Mosque details"
        className="card relative z-10 -mt-6 flex min-w-0 flex-col gap-4 self-start rounded-t-2xl p-5 shadow-[0_-8px_24px_rgb(0_0_0/0.25)] md:mt-0 md:max-h-[640px] md:overflow-y-auto md:rounded-[14px] md:p-6 md:shadow-none"
      >
        <div aria-hidden="true" className="bg-line mx-auto -mt-2 mb-1 h-1 w-10 rounded-full md:hidden" />

        {state.status === "error" && (
          <p role="alert" className="text-muted">
            Recitations couldn&rsquo;t load. Check your connection and refresh.
          </p>
        )}

        {!mosque && (
          <>
            <p className="text-muted">Tap a pin to meet the reciters, or choose a mosque in view:</p>
            {visible.length > 0 ? (
              <ul aria-label="Mosques in view" className="border-line flex flex-col rounded-xl border">
                {visible.map((m) => (
                  <li key={m.id} className="border-line border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => go(m.id)}
                      className="hover:bg-raise flex w-full items-baseline justify-between gap-3 px-3.5 py-2.5 text-left"
                    >
                      <span className="min-w-0 truncate font-medium">{m.name}</span>
                      <span className="text-muted flex-none font-mono text-xs">
                        {m.recitation_count} {m.recitation_count === 1 ? "recitation" : "recitations"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted text-sm">
                No mosques with recitations in this view yet. Zoom out to find some.
              </p>
            )}
          </>
        )}

        {mosque && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="label">
                  {mosque.city}, {mosque.country}
                </p>
                <h2 className="font-display text-[26px] leading-tight">{mosque.name}</h2>
                {mosque.address && <p className="text-muted text-sm">{mosque.address}</p>}
              </div>
              <button
                type="button"
                onClick={() => go(null)}
                className="btn-ghost flex-none"
                aria-label="Close mosque"
              >
                ✕
              </button>
            </div>

            <label className="text-muted flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showQibla}
                onChange={(e) => setShowQibla(e.target.checked)}
                className="accent-lamp size-4"
              />
              Qibla line:{" "}
              <span className="text-lamp font-mono">
                {Math.round(bearing)}° {compassPoint(bearing)}
              </span>
            </label>

            {selected ? (
              <>
                {atMosque.length > 1 && (
                  <button
                    type="button"
                    onClick={() => go(mosque.id)}
                    className="text-muted self-start text-sm underline"
                  >
                    ← All {atMosque.length} recitations here
                  </button>
                )}
                <ReciterProfile recitation={selected} queue={atMosque} />
              </>
            ) : (
              <ul
                aria-label="Recitations at this mosque"
                className="border-line flex flex-col rounded-xl border"
              >
                {atMosque.map((r) => {
                  const s = getSurah(r.surah)!;
                  return (
                    <li key={r.id} className="border-line border-b last:border-b-0">
                      <button
                        type="button"
                        onClick={() => go(mosque.id, r.id)}
                        className="hover:bg-raise grid w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-3 px-3.5 py-3 text-left"
                      >
                        <StarAvatar
                          id={r.reciter.id}
                          name={r.reciter.name}
                          photoUrl={r.reciter.photoUrl}
                          size={40}
                        />
                        <span className="min-w-0">
                          <b className="block truncate font-semibold">{r.reciter.name}</b>
                          <span className="text-muted block truncate text-[13px]">
                            {s.name} {formatRef(r.surah, r.ayahStart, r.ayahEnd)} · {PRAYER_LABELS[r.prayer]}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
