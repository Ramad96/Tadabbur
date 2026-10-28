import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RecitationDetail } from "@/components/detail/RecitationDetail";
import { PrimeAyahs } from "@/components/PrimeAyahs";
import { getBuildRecitations, getMosqueRecitations, getRecitation } from "@/lib/buildData";
import { getAyahRangeAtBuild } from "@/lib/quran/server";
import { formatRef, getSurah } from "@/lib/quran/surahs";

export async function generateStaticParams() {
  return (await getBuildRecitations()).map((r) => ({ id: r.id }));
}

export async function generateMetadata({ params }: PageProps<"/r/[id]">): Promise<Metadata> {
  const r = await getRecitation((await params).id);
  if (!r) return {};
  const s = getSurah(r.surah)!;
  const range = await getAyahRangeAtBuild(r.surah, r.ayahStart, r.ayahEnd);
  const title = `${s.name} ${formatRef(r.surah, r.ayahStart, r.ayahEnd)}, recited by ${r.reciter.name}`;
  const description = `${range.ayahs.map((a) => a.en).join(" ")} Recorded at ${r.mosque.name}, ${r.mosque.city}.`;
  const image = {
    url: `/og/r/${r.id}.png`,
    width: 1200,
    height: 630,
    alt: `${s.name} recited by ${r.reciter.name}`,
  };
  return {
    title,
    description,
    alternates: { canonical: `/r/${r.id}/` },
    openGraph: { title, description, type: "music.song", url: `/r/${r.id}/`, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

export default async function RecitationPage({ params }: PageProps<"/r/[id]">) {
  const r = await getRecitation((await params).id);
  if (!r) notFound();
  const [range, atMosque] = await Promise.all([
    getAyahRangeAtBuild(r.surah, r.ayahStart, r.ayahEnd),
    getMosqueRecitations(r.mosque.id),
  ]);
  const favourites = await Promise.all(
    r.reflections.flatMap((f) =>
      f.favourite ? [getAyahRangeAtBuild(f.favourite.surah, f.favourite.ayah, f.favourite.ayah)] : [],
    ),
  );
  return (
    <>
      <PrimeAyahs ranges={favourites} />
      <RecitationDetail r={r} range={range} related={atMosque.filter((x) => x.id !== r.id)} />
    </>
  );
}
