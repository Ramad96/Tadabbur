"use client";

import { useEffect, useState } from "react";
import type { Recitation } from "./recitations";

export type RecitationsState =
  | { status: "loading" }
  | { status: "ready"; recitations: Recitation[] }
  | { status: "error"; message: string };

// One request per page load, shared by Listen, Map and the player across client navigation.
let request: Promise<Recitation[]> | null = null;

export function loadRecitations() {
  // Loaded on demand: supabase-js and Zod stay off the critical path (pages arrive pre-rendered).
  request ??= import("./recitations")
    .then((m) => m.fetchApprovedRecitations())
    .catch((e) => {
      request = null; // let the next mount retry
      throw e;
    });
  return request;
}

/**
 * Approved recitations. `initial` (the build-time snapshot) renders straight away, so the
 * page arrives complete; the live list replaces it when it loads.
 */
export function useRecitations(initial?: Recitation[]): RecitationsState {
  const [state, setState] = useState<RecitationsState>(
    initial ? { status: "ready", recitations: initial } : { status: "loading" },
  );
  useEffect(() => {
    let live = true;
    loadRecitations().then(
      (recitations) => live && setState({ status: "ready", recitations }),
      // With a snapshot on screen, a failed refresh just keeps it.
      (e: Error) => live && !initial && setState({ status: "error", message: e.message }),
    );
    return () => {
      live = false;
    };
    // The snapshot is only a starting point; it never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}
