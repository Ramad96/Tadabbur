import Link from "next/link";
import { RecitationCard } from "@/components/RecitationCard";
import { SampleBadge } from "@/components/SampleBadge";
import { StarAvatar } from "@/components/StarAvatar";
import type { Recitation } from "@/lib/recitations";
import { removalHref } from "@/lib/site";

/** Every approved recitation by one reciter. */
export function ReciterDetail({ recitations }: { recitations: Recitation[] }) {
  const { reciter } = recitations[0];
  const about = [reciter.ageRange, reciter.occupation].filter(Boolean).join(" · ");
  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-6 pt-8">
      <header className="flex items-center gap-4">
        <StarAvatar id={reciter.id} name={reciter.name} photoUrl={reciter.photoUrl} size={80} />
        <div className="min-w-0">
          <p className="label">Reciter</p>
          <h1 className="font-display text-4xl leading-tight">{reciter.name}</h1>
          {about && <p className="text-muted">{about}</p>}
        </div>
      </header>
      {recitations.some((r) => r.isSample) && (
        <div>
          <SampleBadge />
        </div>
      )}
      {(reciter.heritage || reciter.bio) && (
        <p className="text-lg">
          {reciter.heritage}
          {reciter.heritage && reciter.bio ? ". " : ""}
          {reciter.bio}
        </p>
      )}
      <section aria-labelledby="reciter-recitations">
        <h2 id="reciter-recitations" className="label mb-2">
          {recitations.length} {recitations.length === 1 ? "recitation" : "recitations"}
        </h2>
        <ul className="border-line bg-panel rounded-xl border">
          {recitations.map((r) => (
            <RecitationCard key={r.id} r={r} show="mosque" />
          ))}
        </ul>
      </section>
      <p className="text-muted text-sm">
        Is this you?{" "}
        <a className="text-fg underline" href={removalHref(reciter.name)}>
          Request removal
        </a>{" "}
        ·{" "}
        <Link className="underline" href="/privacy/">
          Privacy
        </Link>
      </p>
    </article>
  );
}
