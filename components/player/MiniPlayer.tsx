"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StarAvatar } from "@/components/StarAvatar";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import { PlayButton, StepButtons, TimeReadout } from "./Controls";
import { usePlayer } from "./PlayerProvider";

/**
 * Sticky bar that keeps the current recitation in reach everywhere except while the Listen
 * page's own stage is on screen. Audio never stops on navigation: the element lives in the layout.
 */
export function MiniPlayer() {
  const { current, stageVisible, time, duration } = usePlayer();
  const pathname = usePathname();
  const onListen = pathname === "/";
  if (!current || (onListen && stageVisible)) return null;
  const s = getSurah(current.surah)!;
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <>
      {/* Spacer so the fixed bar never covers the footer. */}
      <div aria-hidden="true" className="h-20" />
      <section
        aria-label="Mini player"
        className="border-line bg-panel/95 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <div className="bg-line h-0.5">
          <div className="bg-lamp h-full" style={{ width: `${progress}%` }} />
        </div>
        <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-2.5">
          <PlayButton size="sm" />
          <StarAvatar
            id={current.reciter.id}
            name={current.reciter.name}
            photoUrl={current.reciter.photoUrl}
            size={36}
          />
          <Link href="/" className="min-w-0 flex-1 rounded">
            <b className="block truncate text-sm font-semibold">
              {s.name} {formatRef(current.surah, current.ayahStart, current.ayahEnd)}
            </b>
            <span className="text-muted block truncate text-xs">
              {current.reciter.name} · {current.mosque.name}
            </span>
          </Link>
          <span className="hidden sm:inline">
            <TimeReadout />
          </span>
          <span className="hidden gap-2 sm:flex">
            <StepButtons />
          </span>
        </div>
      </section>
    </>
  );
}
