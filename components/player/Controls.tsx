"use client";

import { NextIcon, PauseIcon, PlayIcon, PrevIcon, RepeatIcon, ShuffleIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import { RATES, usePlayer } from "./PlayerProvider";

const round = "grid place-items-center rounded-full";

export function PlayButton({ size = "lg" }: { size?: "lg" | "sm" }) {
  const { playing, toggle, current } = usePlayer();
  const dims = size === "lg" ? "size-14" : "size-11";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={!current}
      aria-label={playing ? "Pause" : "Play"}
      className={`${round} ${dims} bg-lamp text-lamp-ink flex-none disabled:opacity-50`}
    >
      {playing ? <PauseIcon size={size === "lg" ? 22 : 18} /> : <PlayIcon size={size === "lg" ? 22 : 18} />}
    </button>
  );
}

export function StepButtons() {
  const { previous, next, queue } = usePlayer();
  const cls = `${round} border-line bg-raise hover:border-lamp size-10 border disabled:opacity-50`;
  return (
    <>
      <button
        type="button"
        onClick={previous}
        disabled={queue.length < 2}
        aria-label="Previous recitation"
        className={cls}
      >
        <PrevIcon />
      </button>
      <button
        type="button"
        onClick={next}
        disabled={queue.length < 2}
        aria-label="Next recitation"
        className={cls}
      >
        <NextIcon />
      </button>
    </>
  );
}

export function RandomButton() {
  const { random, queue } = usePlayer();
  return (
    <button
      type="button"
      onClick={random}
      disabled={queue.length === 0}
      className="btn-ghost disabled:opacity-50"
    >
      <ShuffleIcon />
      Random
    </button>
  );
}

export function RepeatButton() {
  const { repeat, setRepeat } = usePlayer();
  return (
    <button
      type="button"
      onClick={() => setRepeat(!repeat)}
      aria-pressed={repeat}
      className={`btn-ghost ${repeat ? "border-lamp text-lamp" : ""}`}
    >
      <RepeatIcon />
      Repeat
    </button>
  );
}

export function SpeedSelect() {
  const { rate, setRate } = usePlayer();
  return (
    <label className="btn-ghost cursor-pointer">
      <span className="sr-only">Playback speed</span>
      <select
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="cursor-pointer bg-transparent font-mono text-sm outline-none"
      >
        {RATES.map((r) => (
          <option key={r} value={r} className="bg-panel text-fg">
            {r}×
          </option>
        ))}
      </select>
    </label>
  );
}

export function TimeReadout() {
  const { time, duration } = usePlayer();
  return (
    <span className="text-muted font-mono text-[13px] tabular-nums">
      {formatDuration(time)} / {formatDuration(duration)}
    </span>
  );
}
