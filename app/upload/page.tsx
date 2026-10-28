import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Share a recitation",
  description: "Uploading recitations from your mosque is coming soon to Tadabbur.",
};

const STEPS = [
  ["Audio", "MP3, M4A, WAV or WebM, up to 25 MB and 15 minutes. You’ll hear it back before going on."],
  ["What was recited", "Pick the surah and ayah range. The Arabic is shown so you can check it matches."],
  ["When and where", "Choose the mosque (or pin a new one), the date, time and prayer."],
  ["Reciter", "Their name, an optional photo and a short bio, with explicit consent to show each."],
  ["Reflections", "A few words on why this surah, a favourite ayah, and where they learned to recite."],
  ["Review and submit", "Nothing is public until it has been reviewed and approved."],
] as const;

const mailto = CONTACT_EMAIL
  ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("A recitation for Tadabbur")}&body=${encodeURIComponent(
      "Mosque (name and city):\nReciter's name:\nSurah and ayahs:\nPrayer, date and time:\n\nPlease attach the audio, and confirm the reciter agrees to it being shared publicly.\n",
    )}`
  : null;

export default function UploadPage() {
  return (
    <article className="mx-auto flex max-w-[760px] flex-col gap-8 pt-8">
      <header>
        <p className="label">Coming soon</p>
        <h1 className="font-display mt-1 text-4xl leading-tight sm:text-5xl">Share a recitation</h1>
        <p className="text-muted mt-3 text-lg">
          Soon, reciters and mosques will be able to sign in and add recitations themselves. Here is what it
          will ask for.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="card grid grid-cols-[auto_1fr] gap-4 p-5">
            <span
              aria-hidden="true"
              className="border-line text-lamp grid size-9 place-items-center rounded-full border font-mono text-sm"
            >
              {i + 1}
            </span>
            <span>
              <b className="block font-semibold">{title}</b>
              <span className="text-muted">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      <section className="card flex flex-col gap-3 p-6" aria-labelledby="meanwhile">
        <h2 id="meanwhile" className="font-display text-2xl">
          In the meantime
        </h2>
        <p className="text-muted">
          If your mosque has a recitation to share, send it by email with the details above, and confirm the
          reciter is happy for it to be public. We add it by hand and it is reviewed like everything else.
        </p>
        {mailto && (
          <p>
            <a
              href={mailto}
              className="bg-lamp text-lamp-ink inline-flex rounded-full px-5 py-3 font-semibold"
            >
              Email a recitation
            </a>
          </p>
        )}
        <p className="text-muted text-sm">
          Pins go on mosques only, never homes. Read how we handle names, photos and consent on the{" "}
          <Link href="/privacy/" className="text-fg underline">
            privacy page
          </Link>
          .
        </p>
      </section>
    </article>
  );
}
