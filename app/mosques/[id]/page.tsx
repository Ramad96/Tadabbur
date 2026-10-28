import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MosqueDetail } from "@/components/detail/MosqueDetail";
import { getBuildRecitations, getMosqueRecitations, unique } from "@/lib/buildData";

export async function generateStaticParams() {
  return unique((await getBuildRecitations()).map((r) => r.mosque.id)).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/mosques/[id]">): Promise<Metadata> {
  const list = await getMosqueRecitations((await params).id);
  if (!list.length) return {};
  const { mosque } = list[0];
  const title = `${mosque.name}, ${mosque.city}`;
  const description = `${list.length} ${list.length === 1 ? "recitation" : "recitations"} recorded at ${mosque.name}${mosque.address ? `, ${mosque.address}` : ""}.`;
  return {
    title,
    description,
    alternates: { canonical: `/mosques/${mosque.id}/` },
    openGraph: { title, description, url: `/mosques/${mosque.id}/`, images: [`/og/r/${list[0].id}.png`] },
  };
}

export default async function MosquePage({ params }: PageProps<"/mosques/[id]">) {
  const list = await getMosqueRecitations((await params).id);
  if (!list.length) notFound();
  return <MosqueDetail recitations={list} />;
}
