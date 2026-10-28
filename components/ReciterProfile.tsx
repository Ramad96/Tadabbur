"use client";

import Link from "next/link";
import { AyahText } from "@/components/AyahText";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { usePlayer } from "@/components/player/PlayerProvider";
import { SampleBadge } from "@/components/SampleBadge";
import { StarAvatar } from "@/components/StarAvatar";
import { PRAYER_LABELS, formatDuration, formatRecordedAt } from "@/lib/format";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation, Reflection } from "@/lib/recitations";
import { removalHref } from "@/lib/site";
import { useAyahRange } from "@/lib/useAyahRange";

const QUESTIONS: Record<Reflection["key"], string> = {
  why_surah: "Why this surah?",
  favourite_ayah: "Favourite ayah",
  where_learned: "Where did you learn to recite?",
  what_it_means: "What does it mean to you?",
};

type Props = { recitation: Recitation; queue?: Recitation[]; headingLevel?: "h2" | "h3" };

export function ReciterProfile({ recitation: r, queue, headingLevel: H = "h2" }: Props) {
  const { current, playing, load, toggle } = usePlayer();
  const surah = getSurah(r.surah)!;
  const isCurrent = current?.id === r.id;
  const about = [r.reciter.ageRange, r.reciter.occupation].filter(Boolean).join(" · ");

  return (
    <article className="flex flex-col gap-4" aria-label={`${r.reciter.name}, ${surah.name}`}>
      <div className="flex items-center gap-3.5">
        <StarAvatar id={r.reciter.id} name={r.reciter.name} photoUrl={r.reciter.photoUrl} size={64} />
        <div className="min-w-0">
          <p className="label">{r.mosque.name}</p>
          <H className="font-display text-[30px] leading-tight">
            <Link href={`/reciters/${r.reciter.id}/`} className="rounded hover:underline">
              {r.reciter.name}
            </Link>
          </H>
        </div>
      </div>
      {r.isSample && (
        <div>
          <SampleBadge />
        </div>
      )}
      {(about || r.reciter.heritage || r.reciter.bio) && (
        <p className="text-muted">
          {about}
          {about && r.reciter.heritage ? ". " : ""}
          {r.reciter.heritage}
          {r.reciter.bio ? ` ${r.reciter.bio}` : ""}
        </p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <Fact term="Surah">
          {surah.name} <bdi lang="ar">{surah.arabic}</bdi> · {formatRef(r.surah, r.ayahStart, r.ayahEnd)}
        </Fact>
        <Fact term="Prayer">{PRAYER_LABELS[r.prayer]}</Fact>
        <Fact term="When">{formatRecordedAt(r.recordedAt, r.mosque.timezone)}</Fact>
        <Fact term="Where">
          {r.mosque.name}, {r.mosque.city}
        </Fact>
        {r.durationSec && <Fact term="Length">{formatDuration(r.durationSec)}</Fact>}
      </dl>

      {r.reflections.length > 0 && (
        <ul className="flex flex-col gap-3">
          {r.reflections.map((f) => (
            <li key={f.key} className="border-line border-t pt-3">
              <b className="text-lamp mb-0.5 block text-[13px] font-medium">{QUESTIONS[f.key]}</b>
              {f.favourite && <FavouriteAyah surah={f.favourite.surah} ayah={f.favourite.ayah} />}
              {f.text && <p>{f.text}</p>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => (isCurrent ? toggle() : load(r, { autoplay: true, queue: queue ?? [r] }))}
          className="bg-lamp text-lamp-ink inline-flex items-center gap-2 rounded-full px-5 py-3 font-semibold"
        >
          {isCurrent && playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          {isCurrent && playing ? "Pause" : "Play this recitation"}
        </button>
        <Link href={`/r/${r.id}/`} className="text-muted hover:text-fg text-sm underline">
          Recitation page
        </Link>
        <a href={removalHref(r.reciter.name)} className="text-muted hover:text-fg text-sm underline">
          Request removal
        </a>
      </div>
    </article>
  );
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="label pt-[3px]">{term}</dt>
      <dd>{children}</dd>
    </>
  );
}

function FavouriteAyah({ surah, ayah }: { surah: number; ayah: number }) {
  const range = useAyahRange(surah, ayah, ayah);
  return (
    <div>
      {range && <AyahText range={range} size="body" showTranslation={false} withBasmala={false} />}
      <span className="text-muted text-[13px]">
        {getSurah(surah)!.name} {surah}:{ayah}
      </span>
    </div>
  );
}
