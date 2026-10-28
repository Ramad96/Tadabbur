import Link from "next/link";
import { PinIcon } from "@/components/icons";
import { RecitationCard } from "@/components/RecitationCard";
import { compassPoint, qiblaBearing } from "@/lib/geo";
import type { Recitation } from "@/lib/recitations";

/** Every approved recitation recorded at one mosque. */
export function MosqueDetail({ recitations }: { recitations: Recitation[] }) {
  const { mosque } = recitations[0];
  const bearing = qiblaBearing(mosque.lat, mosque.lng);
  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-6 pt-8">
      <header>
        <p className="label">
          Mosque · {mosque.city}, {mosque.country}
        </p>
        <h1 className="font-display text-4xl leading-tight">{mosque.name}</h1>
        {mosque.address && <p className="text-muted mt-1">{mosque.address}</p>}
        {mosque.website && (
          <p className="mt-1">
            <a className="text-lamp underline" href={mosque.website} rel="noopener">
              {mosque.website.replace(/^https?:\/\/(www\.)?/, "")}
            </a>
          </p>
        )}
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="label pt-[3px]">Qibla</dt>
        <dd className="font-mono">
          {Math.round(bearing)}° {compassPoint(bearing)}
        </dd>
        <dt className="label pt-[3px]">Location</dt>
        <dd className="font-mono">
          {mosque.lat.toFixed(4)}, {mosque.lng.toFixed(4)}
        </dd>
      </dl>
      <div>
        <Link href={`/map/?mosque=${mosque.id}`} className="btn-ghost">
          <PinIcon /> See on map
        </Link>
      </div>
      <section aria-labelledby="mosque-recitations">
        <h2 id="mosque-recitations" className="label mb-2">
          {recitations.length} {recitations.length === 1 ? "recitation" : "recitations"} recorded here
        </h2>
        <ul className="border-line bg-panel rounded-xl border">
          {recitations.map((r) => (
            <RecitationCard key={r.id} r={r} show="reciter" />
          ))}
        </ul>
      </section>
    </article>
  );
}
