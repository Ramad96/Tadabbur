"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { formatDuration } from "@/lib/format";
import { samplePeaks } from "@/lib/library";
import { usePlayer } from "./PlayerProvider";

const subscribeTheme = (cb: () => void) => {
  const o = new MutationObserver(cb);
  o.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => o.disconnect();
};
const getTheme = () => document.documentElement.dataset.theme ?? "dark";

/**
 * WaveSurfer drawn over the site's shared audio element (it never owns or reloads the audio).
 * Sample recitations are silence, so they get a decorative waveform seeded by id.
 * A visually hidden range input carries keyboard and screen-reader seeking.
 */
export function Waveform() {
  const { audio, current, time, duration, seek } = usePlayer();
  const container = useRef<HTMLDivElement>(null);
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark");

  useEffect(() => {
    if (!audio || !current || !container.current) return;
    const el = container.current;
    let ws: { destroy: () => void } | null = null;
    let cancelled = false;
    // Loaded on demand so the waveform library never delays first paint.
    void import("wavesurfer.js").then(({ default: WaveSurfer }) => {
      if (cancelled) return;
      const css = getComputedStyle(document.documentElement);
      ws = WaveSurfer.create({
        container: el,
        media: audio,
        height: 56,
        barWidth: 3,
        barGap: 2,
        barRadius: 2,
        cursorWidth: 0,
        dragToSeek: true,
        // --muted at ~35% opacity: visible on both the dark and light panels.
        waveColor: `${css.getPropertyValue("--muted").trim()}59`,
        progressColor: css.getPropertyValue("--lamp").trim(),
        ...(current.isSample
          ? { peaks: [samplePeaks(current.id)], duration: audio.duration || current.durationSec || 5 }
          : { url: current.audioUrl }), // same src as the audio element, so this only decodes peaks
      });
    });
    return () => {
      cancelled = true;
      ws?.destroy();
    };
  }, [audio, current, theme]);

  const max = duration || 0;
  return (
    <div className="focus-within:outline-lamp relative rounded-md focus-within:outline-2 focus-within:outline-offset-4">
      <div ref={container} aria-hidden="true" className="h-14" />
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={Math.min(time, max)}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label="Seek"
        aria-valuetext={`${formatDuration(time)} of ${formatDuration(max)}`}
        className="sr-only"
        disabled={!max}
      />
    </div>
  );
}
