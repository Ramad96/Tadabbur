import type { Metadata } from "next";
import { ABOUT_DUA, ABOUT_QUOTE, AboutContent } from "@/components/about/AboutContent";
import { getAyahRangeAtBuild } from "@/lib/quran/server";

export const metadata: Metadata = {
  title: "About us",
  description: "What Tadabbur is for, the AmanahDigital team behind it, and a dua.",
};

/** The About sheet's content as its own page: shareable, and what the header link opens without JavaScript. */
export default async function AboutPage() {
  const [quote, dua] = await Promise.all([
    getAyahRangeAtBuild(ABOUT_QUOTE.surah, ABOUT_QUOTE.ayah, ABOUT_QUOTE.ayah),
    getAyahRangeAtBuild(ABOUT_DUA.surah, ABOUT_DUA.ayah, ABOUT_DUA.ayah),
  ]);
  return (
    <article className="mx-auto max-w-[640px] px-1 py-10">
      <h1 className="sr-only">About us</h1>
      <AboutContent quote={quote} dua={dua} />
    </article>
  );
}
