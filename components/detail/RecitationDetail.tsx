import Link from "next/link";
import { AyahText } from "@/components/AyahText";
import { PinIcon } from "@/components/icons";
import { RecitationCard } from "@/components/RecitationCard";
import { ReciterProfile } from "@/components/ReciterProfile";
import type { AyahRange } from "@/lib/quran/text";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation } from "@/lib/recitations";

/**
 * A recitation's own page. Takes plain data so it renders the same at build time and in the
 * live fallback for recitations approved since the last build.
 */
export function RecitationDetail({
  r,
  range,
  related,
}: {
  r: Recitation;
  range: AyahRange | null;
  related: Recitation[];
}) {
  const s = getSurah(r.surah)!;
  return (
    <div className="grid gap-6 pt-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <section className="card flex min-w-0 flex-col gap-5 p-5 sm:p-7" aria-labelledby="recitation-title">
        <p className="label">
          <Link href="/" className="hover:text-fg">
            Listen
          </Link>{" "}
          / Recitation
        </p>
        <h1 id="recitation-title" className="font-display text-3xl leading-tight sm:text-4xl">
          Surah {s.name} <span className="text-muted">{formatRef(r.surah, r.ayahStart, r.ayahEnd)}</span>
          <span className="sr-only">, recited by {r.reciter.name}</span>
        </h1>
        <div className="min-h-[140px]">{range && <AyahText range={range} />}</div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/map/?mosque=${r.mosque.id}&r=${r.id}`} className="btn-ghost">
            <PinIcon /> See on map
          </Link>
          <Link href={`/reciters/${r.reciter.id}/`} className="btn-ghost">
            More from {r.reciter.name}
          </Link>
          <Link href={`/mosques/${r.mosque.id}/`} className="btn-ghost">
            {r.mosque.name}
          </Link>
        </div>
      </section>

      <aside className="card flex min-w-0 flex-col gap-6 self-start p-5 sm:p-6">
        <ReciterProfile recitation={r} queue={[r, ...related]} />
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="label mb-2">
              Also at {r.mosque.name}
            </h2>
            <ul className="border-line rounded-xl border">
              {related.map((x) => (
                <RecitationCard key={x.id} r={x} show="reciter" />
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
