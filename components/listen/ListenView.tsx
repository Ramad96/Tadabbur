"use client";

import { useEffect } from "react";
import { usePlayer } from "@/components/player/PlayerProvider";
import type { Recitation } from "@/lib/recitations";
import { useRecitations } from "@/lib/useRecitations";
import { Library } from "./Library";
import { NowPlaying } from "./NowPlaying";

export function ListenView({ initial }: { initial?: Recitation[] }) {
  const state = useRecitations(initial);
  const { current, load } = usePlayer();

  // First visit: cue up the newest recitation without playing it.
  useEffect(() => {
    if (state.status === "ready" && !current && state.recitations[0]) {
      load(state.recitations[0], { queue: state.recitations });
    }
  }, [state, current, load]);

  if (state.status === "error") {
    return (
      <div role="alert" className="card mt-6 p-8 text-center">
        <p className="font-display text-2xl">Recitations couldn&rsquo;t load</p>
        <p className="text-muted mt-2">Check your connection and refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 pt-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <NowPlaying fallback={state.status === "ready" ? state.recitations[0] : undefined} />
      {state.status === "ready" ? (
        <Library recitations={state.recitations} />
      ) : (
        <div className="card text-muted p-6" aria-busy="true">
          Loading recitations…
        </div>
      )}
    </div>
  );
}
