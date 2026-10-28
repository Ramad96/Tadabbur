import { ayahMarker, getSurah } from "@/lib/quran/surahs";
import type { AyahRange } from "@/lib/quran/text";
import { SectionDivider } from "@/components/SectionDivider";

/**
 * UI-02 About us, in three sections: About Tadabbur, AmanahDigital, Dua.
 * The pull quote (38:29) and the dua (3:8) are whole ayahs from the bundled Tanzil text,
 * passed in at build time; nothing here types Qur'anic Arabic.
 */
export const ABOUT_QUOTE = { surah: 38, ayah: 29 } as const;
export const ABOUT_DUA = { surah: 3, ayah: 8 } as const;

type Props = {
  quote: AyahRange;
  dua: AyahRange;
  /** Keeps heading ids unique when the page and the dialog both render this. */
  idPrefix?: string;
};

const body = "text-fg leading-[1.65]";

function Ayah({ range }: { range: AyahRange }) {
  const a = range.ayahs[0];
  return (
    <span lang="ar" dir="rtl" className="ayah block">
      <span data-ayah={a.n}>{a.ar}</span>{" "}
      <span className="text-lamp" aria-hidden="true">
        {ayahMarker(a.n)}
      </span>
    </span>
  );
}

export function AboutContent({ quote, dua, idPrefix = "about" }: Props) {
  const quoteSurah = getSurah(quote.surah)!;
  const duaSurah = getSurah(dua.surah)!;
  return (
    <div className="flex flex-col gap-7">
      <section aria-labelledby={`${idPrefix}-app`} className="flex flex-col gap-3.5">
        <SectionDivider id={`${idPrefix}-app`} title="About Tadabbur" />
        <p className={body}>
          Tadabbur (<bdi lang="ar">تَدَبُّر</bdi>) means deep reflection: pondering the Qur&rsquo;an until its
          meaning settles in the heart.
        </p>
        <p className={body}>
          This is a place to hear the Qur&rsquo;an in the voices of the living: imams, students, parents and
          neighbours, recorded where they pray, each pinned to their mosque with a few words on why the surah
          matters to them.
        </p>
        <p className={body}>
          Listen to an everyday voice from across the world, find the mosques near you, and let a familiar
          ayah land differently.
        </p>
        <figure className="mt-1 flex gap-3">
          <span aria-hidden="true" className="bg-lamp w-[2.5px] flex-none rounded-full" />
          <blockquote className="text-muted flex flex-col gap-2">
            <span className="text-fg text-[22px]">
              <Ayah range={quote} />
            </span>
            <p className="font-display text-lg leading-snug italic">&ldquo;{quote.ayahs[0].en}&rdquo;</p>
            <figcaption className="text-sm">
              &mdash; {quoteSurah.name} {quote.surah}:{quote.ayahs[0].n}
            </figcaption>
          </blockquote>
        </figure>
      </section>

      <section aria-labelledby={`${idPrefix}-amanah`} className="flex flex-col gap-3.5">
        <SectionDivider id={`${idPrefix}-amanah`} title="AmanahDigital" />
        <p className={body}>
          AmanahDigital is a small team dedicated to building thoughtful, faith-centred digital tools for the
          Muslim community. We believe technology should serve the soul, not distract from it.
        </p>
        <p className={body}>
          Tadabbur is built with care, sincerity, and the hope that it becomes a means of khayr for every
          person who uses it.
        </p>
        <p>
          <a
            href="https://amanahdigital.co.uk"
            target="_blank"
            rel="noopener"
            className="text-lamp inline-flex items-center gap-1 text-sm underline underline-offset-2"
          >
            amanahdigital.co.uk
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <path d="M7 17L17 7M8 7h9v9" />
            </svg>
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </p>
      </section>

      <section aria-labelledby={`${idPrefix}-dua`} className="flex flex-col gap-3.5">
        <SectionDivider id={`${idPrefix}-dua`} title="Dua" />
        <p className={body}>
          We ask Allah to make this a means of reflection and guidance. May it help every listener draw closer
          to Him, hear His words with an open heart, and hold firm to what they have been given.
        </p>
        <div className="text-lamp py-2 text-center text-[22px]">
          <Ayah range={dua} />
        </div>
        <p className="font-display text-muted text-center text-lg leading-snug italic">
          &ldquo;{dua.ayahs[0].en}&rdquo;
        </p>
        <p className="text-muted text-center text-sm">
          {duaSurah.name} {dua.surah}:{dua.ayahs[0].n}
        </p>
      </section>
    </div>
  );
}
