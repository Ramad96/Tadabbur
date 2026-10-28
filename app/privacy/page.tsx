import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Tadabbur stores, what it doesn't, and how to have a recitation removed.",
};

const H2 = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2 id={id} className="font-display mt-10 scroll-mt-6 text-2xl">
    {children}
  </h2>
);

export default function PrivacyPage() {
  const email = CONTACT_EMAIL ? (
    <a className="text-fg underline" href={`mailto:${CONTACT_EMAIL}`}>
      {CONTACT_EMAIL}
    </a>
  ) : (
    "the site team"
  );

  return (
    <article className="text-muted mx-auto max-w-[65ch] py-10 [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="font-display text-fg text-4xl">Privacy</h1>
      <p>
        Tadabbur shares recitations by people who pray in mosques, with a short profile of each reciter. This
        page explains what that involves for listeners and for reciters. Questions go to {email}.
      </p>

      <H2>If you&rsquo;re listening</H2>
      <ul>
        <li>You don&rsquo;t need an account, and there are no cookies, analytics or advertising trackers.</li>
        <li>
          When you play a recitation we add one to its play count. Nothing about you is stored with it: no
          account, cookie, IP address or device ID.
        </li>
        <li>
          Your light/dark theme choice is kept in your own browser&rsquo;s storage and never sent anywhere.
        </li>
        <li>
          The map only uses your location if you press the locate button, and then only in your browser, to
          move the map. It is never sent to us.
        </li>
      </ul>

      <H2>Services a visit touches</H2>
      <ul>
        <li>
          <b className="text-fg">GitHub Pages</b> hosts the site. Like any web host it sees your IP address
          when serving pages.
        </li>
        <li>
          <b className="text-fg">Supabase</b> holds the recitation data and counts plays. Your browser fetches
          recitations from it directly.
        </li>
        <li>
          <b className="text-fg">OpenFreeMap</b> serves the map tiles on the Map page, based on OpenStreetMap
          data.
        </li>
        <li>Fonts are served from this site itself, not from Google.</li>
      </ul>

      <H2>If you&rsquo;re a reciter</H2>
      <ul>
        <li>
          Pins sit on mosques, never on homes. A recitation is always tied to the mosque where it was
          recorded.
        </li>
        <li>
          Your name and profile appear only with your recorded consent to be shown publicly. A photo appears
          only with separate consent for the photo; without it, the site shows a generated pattern with your
          initials.
        </li>
        <li>Ages are shown as a range (for example 25–34), never an exact age or date of birth.</li>
        <li>Nothing is public until it has been reviewed and approved.</li>
      </ul>

      <H2 id="removal">Request removal</H2>
      <p>
        If you are a reciter, or speak for a mosque, and want a recitation or profile taken down, email{" "}
        {email} with a link to the page. We remove it promptly, without asking why. Every reciter profile has
        a &ldquo;Request removal&rdquo; link that starts this email for you.
      </p>

      <H2>Sample data</H2>
      <p>
        The site currently shows sample recitations for London. The mosques are real, but the reciters and
        their reflections are fictional and the audio is silent. Each is marked &ldquo;Sample&rdquo;, and all
        of them will be removed before real recitations go live.
      </p>

      <H2>The Qur&rsquo;an text</H2>
      <p>
        Arabic text is the Tanzil Project&rsquo;s Uthmani text, reproduced verbatim under its licence; the
        English translation is M. M. Pickthall&rsquo;s (1930), in the public domain. See{" "}
        <a className="text-fg underline" href="https://tanzil.net" rel="noopener">
          tanzil.net
        </a>
        .
      </p>

      <p className="mt-10">
        <Link href="/" className="btn-ghost">
          Back to Listen
        </Link>
      </p>
    </article>
  );
}
