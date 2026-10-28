"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadRecitations } from "@/lib/useRecitations";
import { useAyahRange } from "@/lib/useAyahRange";
import type { Recitation } from "@/lib/recitations";
import { MosqueDetail } from "./MosqueDetail";
import { RecitationDetail } from "./RecitationDetail";
import { ReciterDetail } from "./ReciterDetail";

const ROUTE = /^\/(r|reciters|mosques)\/([0-9a-f-]{36})\/?$/;

type State =
  | { kind: "checking" }
  | { kind: "missing" }
  | { kind: "r"; r: Recitation; related: Recitation[] }
  | { kind: "reciters" | "mosques"; list: Recitation[] };

async function resolveLive(pathname: string): Promise<State> {
  const m = ROUTE.exec(pathname);
  if (!m) return { kind: "missing" };
  const [, kind, id] = m;
  const all = await loadRecitations().catch(() => null);
  if (!all) return { kind: "missing" };
  if (kind === "r") {
    const r = all.find((x) => x.id === id);
    return r
      ? { kind, r, related: all.filter((x) => x.mosque.id === r.mosque.id && x.id !== id) }
      : { kind: "missing" };
  }
  const list = all.filter((x) => (kind === "reciters" ? x.reciter.id : x.mosque.id) === id);
  return list.length ? { kind: kind as "reciters" | "mosques", list } : { kind: "missing" };
}

/**
 * GitHub Pages serves 404.html for any page that wasn't built. Detail pages are built from the
 * data at build time, so a recitation approved since then lands here. If the URL is one of ours,
 * load it live and show it; otherwise it's a real 404.
 */
export function LiveFallback({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let live = true;
    resolveLive(location.pathname).then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, []);

  if (state.kind === "checking") return <p className="text-muted py-24 text-center">Loading…</p>;
  if (state.kind === "missing") return <>{children}</>;
  if (state.kind === "r") return <LiveRecitation r={state.r} related={state.related} />;
  return (
    <>
      {state.kind === "reciters" ? (
        <ReciterDetail recitations={state.list} />
      ) : (
        <MosqueDetail recitations={state.list} />
      )}
      <NewlyAdded />
    </>
  );
}

function LiveRecitation({ r, related }: { r: Recitation; related: Recitation[] }) {
  const range = useAyahRange(r.surah, r.ayahStart, r.ayahEnd);
  return (
    <>
      <RecitationDetail r={r} range={range} related={related} />
      <NewlyAdded />
    </>
  );
}

function NewlyAdded() {
  return (
    <p className="text-muted mt-6 text-center text-sm">
      Newly added: this page will get a link preview at the next site update.{" "}
      <Link href="/" className="underline">
        Back to Listen
      </Link>
    </p>
  );
}
