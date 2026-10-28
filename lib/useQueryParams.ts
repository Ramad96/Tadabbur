"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENT = "tadabbur:querychange";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

/**
 * The page's query string, without useSearchParams: in a static export that hook makes the
 * whole subtree render client-side only, so the pre-rendered HTML would be an empty box.
 * Here the server (and hydration) see no params, then the real ones apply straight after.
 */
export function useQueryParams() {
  const search = useSyncExternalStore(
    subscribe,
    () => location.search,
    () => "",
  );
  const params = new URLSearchParams(search);

  const replace = useCallback((next: Record<string, string | null>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) q.set(k, v);
    // Next's App Router keeps itself in sync with the native History API.
    history.replaceState(history.state, "", q.size ? `${location.pathname}?${q}` : location.pathname);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [params, replace] as const;
}
