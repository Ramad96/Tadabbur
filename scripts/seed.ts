/**
 * Seeds the London sample data.
 *
 *   pnpm db:seed       upserts into your Supabase project through the REST API
 *                      (needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
 *   pnpm db:seed:sql   regenerates supabase/seed.sql, which you can also paste into the SQL Editor
 *
 * Safe to run repeatedly: rows have fixed ids and are upserted.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SEED_TABLES, buildSeedRows, toSql } from "../data/seed/rows.ts";

const root = join(import.meta.dirname, "..");
const rows = buildSeedRows();

if (process.argv.includes("--sql")) {
  writeFileSync(join(root, "supabase/seed.sql"), toSql(rows));
  console.log("Wrote supabase/seed.sql");
  process.exit(0);
}

process.loadEnvFile(join(root, ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema: "tadabbur" }, auth: { persistSession: false } });

for (const table of SEED_TABLES) {
  const list = rows[table] as Record<string, unknown>[]; // union of row types; the script client is untyped
  const { error } = await supabase.from(table).upsert(list, { onConflict: "id" });
  if (error) {
    console.error(`✗ ${table}: ${error.message}`);
    if (error.code === "PGRST205")
      console.error("  Has supabase/migrations/0001_init.sql been run in the SQL Editor?");
    process.exit(1);
  }
  console.log(`✓ ${table}: ${rows[table].length} rows`);
}
console.log("Done. 12 sample recitations are live (approved, is_sample = true).");
