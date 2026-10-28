import type { MetadataRoute } from "next";
import { getBuildRecitations, unique } from "@/lib/buildData";

export const dynamic = "force-static";

const SITE = "https://tadabbur.amanahdigital.co.uk";

/** Every page this build pre-rendered. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all = await getBuildRecitations();
  const page = (path: string, lastModified?: string) => ({ url: `${SITE}${path}`, lastModified });
  return [
    page("/"),
    page("/map/"),
    page("/upload/"),
    page("/privacy/"),
    ...all.map((r) => page(`/r/${r.id}/`, r.recordedAt)),
    ...unique(all.map((r) => r.reciter.id)).map((id) => page(`/reciters/${id}/`)),
    ...unique(all.map((r) => r.mosque.id)).map((id) => page(`/mosques/${id}/`)),
  ];
}
