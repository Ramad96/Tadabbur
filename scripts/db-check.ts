/**
 * Checks your live Supabase project the way a signed-out visitor sees it, using only the anon key.
 * Run after pasting the migration (and again after seeding): pnpm db:check
 */
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(join(import.meta.dirname, "../.env.local"));
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: { schema: "tadabbur" },
    auth: { persistSession: false },
  },
);

let failed = false;
const check = (ok: boolean, label: string, detail = "") => {
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` (${detail})` : ""}`);
  if (!ok) failed = true;
};

// Plain GETs (not HEAD) so PostgREST's error codes come back.
for (const table of ["profiles", "reciters", "mosques", "recitations", "reflections", "reports", "plays"]) {
  const { error } = await supabase.from(table).select("*").limit(0);
  if (error?.code === "PGRST106") {
    console.error(`✗ the tadabbur schema is not exposed to the API (${error.hint})`);
    console.error("  Fix: Project Settings → Data API → Exposed schemas → add tadabbur → Save.");
    process.exit(1);
  }
  check(!error, `table tadabbur.${table} exists`, error ? `${error.code}: ${error.message}` : "");
}

const { count } = await supabase.from("recitations").select("*", { count: "exact" }).limit(0);
check((count ?? 0) === 12, "12 approved sample recitations are readable", `${count ?? 0} found`);

const { data: pins, error: rpcError } = await supabase.rpc("mosques_with_counts", {
  min_lng: -0.6,
  min_lat: 51.25,
  max_lng: 0.35,
  max_lat: 51.75,
});
check(
  !rpcError && pins?.length === 12,
  "mosques_with_counts() returns 12 London pins",
  rpcError?.message ?? `${pins?.length ?? 0} pins`,
);

// Must fail specifically on row-level security (42501), not for some other reason.
const { error: writeError } = await supabase
  .from("mosques")
  .insert({ name: "db-check", city: "x", country: "x", location: "SRID=4326;POINT(0 0)" });
check(
  writeError?.code === "42501",
  "signed-out visitors cannot write",
  writeError ? writeError.code : "INSERT SUCCEEDED",
);

const { error: playError } = await supabase.rpc("record_play", {
  recitation: "00000000-0000-4000-8000-cccc00000001",
});
// An id that matches nothing, so the check never adds a real play to the stats.
check(!playError, "record_play() is callable by visitors", playError?.message);

process.exit(failed ? 1 : 0);
