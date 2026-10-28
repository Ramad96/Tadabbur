"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AyahText } from "@/components/AyahText";
import { PinIcon } from "@/components/icons";
import {
  PlayButton,
  RandomButton,
  RepeatButton,
  SpeedSelect,
  StepButtons,
  TimeReadout,
} from "@/components/player/Controls";
import { usePlayer } from "@/components/player/PlayerProvider";
import { Waveform } from "@/components/player/Waveform";
import { SampleBadge } from "@/components/SampleBadge";
import { StarAvatar } from "@/components/StarAvatar";
import { PRAYER_LABELS, formatRecordedAt } from "@/lib/format";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation } from "@/lib/recitations";
import { useAyahRange } from "@/lib/useAyahRange";

/** fallback: what to show before the player has cued anything (the pre-rendered first paint). */
export function NowPlaying({ fallback }: { fallback?: Recitation }) {
  const { current, playing, setStageVisible } = usePlayer();
  const shown = current ?? fallback ?? null;
  const stage = useRef<HTMLElement>(null);

  // Tell the mini-player when this stage scrolls out of view (and that it's gone on unmount).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStageVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => {
      io.disconnect();
      setStageVisible(false);
    };
  }, [setStageVisible]);

  return (
    <section ref={stage} aria-label="Now playing" className="card flex min-w-0 flex-col gap-5 p-5 sm:p-7">
      {shown ? <Stage r={shown} /> : <p className="text-muted py-16 text-center">Loading recitations…</p>}
      <span className="sr-only" aria-live="polite">
        {current && playing ? `Playing ${current.reciter.name}` : ""}
      </span>
    </section>
  );
}

function Stage({ r }: { r: Recitation }) {
  const { playing, error } = usePlayer();
  const surah = getSurah(r.surah)!;
  const range = useAyahRange(r.surah, r.ayahStart, r.ayahEnd);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label">{playing ? "Now playing" : "Ready to play"}</p>
        {r.isSample && <SampleBadge />}
      </div>

      <div className="min-h-[180px]">{range && <AyahText range={range} />}</div>

      <p className="text-lamp text-center font-mono text-xs">
        <Link href={`/r/${r.id}/`} className="rounded hover:underline" title="Open this recitation's page">
          Surah {surah.name} <bdi lang="ar">{surah.arabic}</bdi> ·{" "}
          {formatRef(r.surah, r.ayahStart, r.ayahEnd)}
        </Link>
      </p>

      <Waveform />
      {error && (
        <p role="alert" className="border-lamp text-fg rounded-lg border px-3 py-2 text-sm">
          {error} Try again in a moment, or choose another recitation.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <PlayButton />
        <StepButtons />
        <RandomButton />
        <RepeatButton />
        <SpeedSelect />
        <span className="ml-auto">
          <TimeReadout />
        </span>
      </div>

      <div className="border-line flex items-center gap-3.5 border-t pt-4">
        <StarAvatar id={r.reciter.id} name={r.reciter.name} photoUrl={r.reciter.photoUrl} size={48} />
        <div className="min-w-0 flex-1">
          <Link href={`/reciters/${r.reciter.id}/`} className="block rounded font-semibold hover:underline">
            {r.reciter.name}
          </Link>
          <span className="text-muted text-[13px]">
            {r.mosque.name}, {r.mosque.city} · {PRAYER_LABELS[r.prayer]} ·{" "}
            {formatRecordedAt(r.recordedAt, r.mosque.timezone)}
          </span>
        </div>
        <Link href={`/map/?mosque=${r.mosque.id}`} className="btn-ghost flex-none">
          <PinIcon />
          <span className="max-sm:sr-only">See on map</span>
        </Link>
      </div>
    </>
  );
}
