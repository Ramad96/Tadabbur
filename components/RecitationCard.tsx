import Link from "next/link";
import { StarAvatar } from "@/components/StarAvatar";
import { PRAYER_LABELS, formatRecordedAt } from "@/lib/format";
import { formatRef, getSurah } from "@/lib/quran/surahs";
import type { Recitation } from "@/lib/recitations";

/** A compact row linking to a recitation's own page. */
export function RecitationCard({ r, show }: { r: Recitation; show: "reciter" | "mosque" }) {
  const s = getSurah(r.surah)!;
  return (
    <li className="border-line border-b last:border-b-0">
      <Link
        href={`/r/${r.id}/`}
        className="hover:bg-raise grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-3"
      >
        <StarAvatar id={r.reciter.id} name={r.reciter.name} photoUrl={r.reciter.photoUrl} size={40} />
        <span className="min-w-0">
          <b className="block truncate font-semibold">
            {s.name}{" "}
            <span className="text-muted font-normal">{formatRef(r.surah, r.ayahStart, r.ayahEnd)}</span>
          </b>
          <span className="text-muted block truncate text-[13px]">
            {show === "reciter" ? r.reciter.name : r.mosque.name} · {PRAYER_LABELS[r.prayer]} ·{" "}
            {formatRecordedAt(r.recordedAt, r.mosque.timezone)}
          </span>
        </span>
        <span lang="ar" dir="rtl" className="font-ayah text-lamp text-xl">
          {s.arabic}
        </span>
      </Link>
    </li>
  );
}
