"use client";

import { useMemo, useState } from "react";
import { usePlayer } from "@/components/player/PlayerProvider";
import { StarAvatar } from "@/components/StarAvatar";
import { citiesIn, filterRecitations, surahsIn } from "@/lib/library";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation } from "@/lib/recitations";

export function Library({ recitations }: { recitations: Recitation[] }) {
  const { current, load } = usePlayer();
  const [query, setQuery] = useState("");
  const [surah, setSurah] = useState<number | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const rows = useMemo(
    () => filterRecitations(recitations, { query, surah, city }),
    [recitations, query, surah, city],
  );
  const surahs = useMemo(() => surahsIn(recitations), [recitations]);
  const cities = useMemo(() => citiesIn(recitations), [recitations]);

  const chip = (pressed: boolean) =>
    `rounded-full border px-3 py-1 text-[13px] ${pressed ? "border-lamp text-lamp" : "border-line text-muted hover:text-fg"}`;

  return (
    <section aria-labelledby="library-heading" className="flex min-w-0 flex-col gap-3">
      <h2 id="library-heading" className="sr-only">
        Recitations
      </h2>
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search surah, reciter, mosque or city"
          aria-label="Search recitations"
          className="border-line bg-panel text-fg placeholder:text-muted min-w-0 flex-1 rounded-[10px] border px-3.5 py-2.5"
        />
        <label className="sr-only" htmlFor="city-filter">
          City
        </label>
        <select
          id="city-filter"
          value={city ?? ""}
          onChange={(e) => setCity(e.target.value || null)}
          className="border-line bg-panel text-fg rounded-[10px] border px-3"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      <div role="group" aria-label="Filter by surah" className="flex flex-wrap gap-1.5">
        <button
          type="button"
          aria-pressed={surah === null}
          onClick={() => setSurah(null)}
          className={chip(surah === null)}
        >
          All
        </button>
        {surahs.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={surah === n}
            onClick={() => setSurah(n)}
            className={chip(surah === n)}
          >
            {getSurah(n)!.name}
          </button>
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {rows.length} {rows.length === 1 ? "recitation" : "recitations"}
      </p>

      {recitations.length === 0 ? (
        <p className="border-line bg-panel text-muted rounded-xl border p-6 text-center">
          No recitations have been shared yet. The first ones are on their way.
        </p>
      ) : (
        rows.length === 0 && (
          <p className="border-line bg-panel text-muted rounded-xl border p-6 text-center">
            No recitations match{query ? ` “${query}”` : " these filters"}. Try a surah name like “Mulk”.
          </p>
        )
      )}

      <ul
        aria-label="Recitations"
        className="border-line bg-panel flex max-h-[560px] flex-col overflow-y-auto rounded-xl border empty:hidden"
      >
        {rows.map((r) => {
          const s = getSurah(r.surah)!;
          const isCurrent = current?.id === r.id;
          return (
            <li key={r.id} className="border-line border-b last:border-b-0">
              <button
                type="button"
                onClick={() => load(r, { autoplay: true, queue: rows })}
                aria-current={isCurrent ? "true" : undefined}
                className={`hover:bg-raise grid w-full grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3 text-left ${
                  isCurrent ? "bg-raise shadow-[inset_3px_0_0_var(--lamp)]" : ""
                }`}
              >
                <StarAvatar id={r.reciter.id} name={r.reciter.name} photoUrl={r.reciter.photoUrl} size={40} />
                <span className="min-w-0">
                  <b className="block truncate font-semibold">
                    {s.name}{" "}
                    <span className="text-muted font-normal">
                      {formatRef(r.surah, r.ayahStart, r.ayahEnd)}
                    </span>
                  </b>
                  <span className="text-muted block truncate text-[13px]">
                    {r.reciter.name} · {r.mosque.name}
                  </span>
                </span>
                <span lang="ar" dir="rtl" className="font-ayah text-lamp text-xl">
                  {s.arabic}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
