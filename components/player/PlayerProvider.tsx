"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { PRAYER_LABELS } from "@/lib/format";
import { pickRandom } from "@/lib/library";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation } from "@/lib/recitations";

export const RATES = [0.75, 0.9, 1, 1.1, 1.25] as const;

type PlayerState = {
  current: Recitation | null;
  queue: Recitation[];
  playing: boolean;
  time: number;
  duration: number;
  rate: number;
  repeat: boolean;
  /** True while the Listen page's big stage is on screen; the mini-player hides then. */
  stageVisible: boolean;
  /** Set when the current recitation's audio fails to load or play. */
  error: string | null;
};

type PlayerApi = PlayerState & {
  audio: HTMLAudioElement | null;
  /** Make r current. queue sets what previous/next step through. */
  load: (r: Recitation, opts?: { autoplay?: boolean; queue?: Recitation[] }) => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  next: () => void;
  previous: () => void;
  random: () => void;
  setRate: (rate: number) => void;
  setRepeat: (on: boolean) => void;
  setStageVisible: (visible: boolean) => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Mutate the element through the ref; the state copy only tells consumers it has mounted.
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const attachAudio = useCallback((el: HTMLAudioElement | null) => {
    audioRef.current = el;
    setAudio(el);
  }, []);
  const [current, setCurrent] = useState<Recitation | null>(null);
  const [queue, setQueue] = useState<Recitation[]>([]);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRateState] = useState(1);
  const [repeat, setRepeatState] = useState(false);
  const [stageVisible, setStageVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const counted = useRef(new Set<string>());

  const load = useCallback<PlayerApi["load"]>(
    (r, opts = {}) => {
      if (opts.queue) setQueue(opts.queue);
      setCurrent(r);
      setError(null);
      const el = audioRef.current;
      if (!el) return;
      if (el.getAttribute("src") !== r.audioUrl) {
        el.src = r.audioUrl;
        setTime(0);
        setDuration(0);
      } else {
        el.currentTime = 0;
      }
      el.playbackRate = rate;
      if (opts.autoplay) el.play().catch(() => setPlaying(false));
    },
    [rate],
  );

  const step = useCallback(
    (delta: 1 | -1) => {
      if (!current || queue.length === 0) return;
      const i = queue.findIndex((r) => r.id === current.id);
      const nextR = queue[(i + delta + queue.length) % queue.length];
      if (nextR) load(nextR, { autoplay: true });
    },
    [current, queue, load],
  );

  const api = useMemo<PlayerApi>(
    () => ({
      audio,
      current,
      queue,
      playing,
      time,
      duration,
      rate,
      repeat,
      stageVisible,
      error,
      load,
      toggle: () => {
        const el = audioRef.current;
        if (!el || !current) return;
        if (el.paused) el.play().catch(() => setPlaying(false));
        else el.pause();
      },
      seek: (s) => {
        const el = audioRef.current;
        if (el && Number.isFinite(s)) el.currentTime = Math.max(0, Math.min(s, el.duration || s));
      },
      next: () => step(1),
      previous: () => step(-1),
      random: () => {
        const r = pickRandom(queue, current?.id ?? null);
        if (r) load(r, { autoplay: true });
      },
      setRate: (r) => {
        setRateState(r);
        if (audioRef.current) audioRef.current.playbackRate = r;
      },
      setRepeat: (on) => {
        setRepeatState(on);
        if (audioRef.current) audioRef.current.loop = on;
      },
      setStageVisible,
    }),
    [audio, current, queue, playing, time, duration, rate, repeat, stageVisible, error, load, step],
  );

  // Audio element events → state, plus one anonymous play count per recitation per visit.
  useEffect(() => {
    if (!audio) return;
    const onPlay = () => {
      setPlaying(true);
      if (current && !counted.current.has(current.id)) {
        counted.current.add(current.id);
        const id = current.id;
        // Loaded on first play, not on page load.
        void import("@/lib/supabase").then(({ supabase }) =>
          supabase?.rpc("record_play", { recitation: id }),
        );
      }
    };
    const onPause = () => setPlaying(false);
    const onTime = () => setTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onError = () => {
      setPlaying(false);
      setError(
        navigator.onLine
          ? "This recitation’s audio couldn’t be loaded."
          : "You’re offline, so the audio can’t load.",
      );
    };
    audio.addEventListener("error", onError);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("error", onError);
    };
  }, [audio, current]);

  // Lock-screen and headset controls.
  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const surah = getSurah(current.surah)!;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${surah.name} ${formatRef(current.surah, current.ayahStart, current.ayahEnd)}`,
      artist: current.reciter.name,
      album: `${current.mosque.name} · ${PRAYER_LABELS[current.prayer]}`,
      artwork: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => audio?.play()],
      ["pause", () => audio?.pause()],
      ["previoustrack", () => api.previous()],
      ["nexttrack", () => api.next()],
      ["seekto", (d) => d.seekTime !== undefined && api.seek(d.seekTime)],
      ["seekbackward", (d) => audio && api.seek(audio.currentTime - (d.seekOffset ?? 10))],
      ["seekforward", (d) => audio && api.seek(audio.currentTime + (d.seekOffset ?? 10))],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Not every browser supports every action.
      }
    }
  }, [current, audio, api]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = playing ? "playing" : "paused";
  }, [playing]);

  return (
    <PlayerContext.Provider value={api}>
      {children}
      {/* The one audio element for the whole site. It lives in the root layout, so it survives navigation. */}
      <audio ref={attachAudio} preload="metadata" data-testid="player-audio" />
    </PlayerContext.Provider>
  );
}
