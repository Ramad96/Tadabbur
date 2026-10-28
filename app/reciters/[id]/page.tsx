import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReciterDetail } from "@/components/detail/ReciterDetail";
import { getBuildRecitations, getReciterRecitations, unique } from "@/lib/buildData";

export async function generateStaticParams() {
  return unique((await getBuildRecitations()).map((r) => r.reciter.id)).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/reciters/[id]">): Promise<Metadata> {
  const list = await getReciterRecitations((await params).id);
  if (!list.length) return {};
  const { reciter, mosque } = list[0];
  const title = `${reciter.name}, reciter`;
  const description = `${list.length} ${list.length === 1 ? "recitation" : "recitations"} by ${reciter.name}, recorded at ${mosque.name}, ${mosque.city}.`;
  return {
    title,
    description,
    alternates: { canonical: `/reciters/${reciter.id}/` },
    openGraph: { title, description, url: `/reciters/${reciter.id}/`, images: [`/og/r/${list[0].id}.png`] },
  };
}

export default async function ReciterPage({ params }: PageProps<"/reciters/[id]">) {
  const list = await getReciterRecitations((await params).id);
  if (!list.length) notFound();
  return <ReciterDetail recitations={list} />;
}
