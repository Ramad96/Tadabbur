import { ListenView } from "@/components/listen/ListenView";
import { PrimeAyahs } from "@/components/PrimeAyahs";
import { getBuildRecitations } from "@/lib/buildData";
import { getAyahRangeAtBuild } from "@/lib/quran/server";

export default async function ListenPage() {
  // Pre-render with the build-time snapshot so the page arrives complete; live data refreshes it.
  const initial = await getBuildRecitations();
  const first = initial[0];
  const ranges = first ? [await getAyahRangeAtBuild(first.surah, first.ayahStart, first.ayahEnd)] : [];
  return (
    <>
      <h1 className="sr-only">Listen to recitations</h1>
      <PrimeAyahs ranges={ranges} />
      <ListenView initial={initial} />
    </>
  );
}
