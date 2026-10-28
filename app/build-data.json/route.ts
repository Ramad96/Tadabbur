import { getBuildRecitations } from "@/lib/buildData";

// Written to out/build-data.json: what this build pre-rendered. scripts/build-og.ts reads it
// to draw the link-preview images, and it's the same public data the API already serves.
export const dynamic = "force-static";

export async function GET() {
  return Response.json({ builtAt: new Date().toISOString(), recitations: await getBuildRecitations() });
}
