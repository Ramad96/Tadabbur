import { readFileSync } from "node:fs";
import type { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { buildSeedRows, toSql } from "@/data/seed/rows";
import type {
  Database,
  MosqueRow,
  PlayRow,
  ProfileRow,
  ReciterRow,
  RecitationRow,
  ReflectionRow,
  ReportRow,
} from "@/lib/database.types";
import { SURAHS } from "@/lib/quran/surahs";
import { createDb } from "./harness";

/** Lists every key of Row exactly; typecheck fails if a column is missing from the list. */
const columns =
  <Row>() =>
  <const K extends readonly (keyof Row & string)[]>(
    ...keys: K & ([Exclude<keyof Row, K[number]>] extends [never] ? unknown : never)
  ) =>
    [...keys].sort();

const EXPECTED_COLUMNS = {
  profiles: columns<ProfileRow>()("id", "display_name", "role", "created_at"),
  reciters: columns<ReciterRow>()(
    "id",
    "profile_id",
    "name",
    "photo_url",
    "bio",
    "age_range",
    "occupation",
    "heritage",
    "consent_public",
    "consent_photo",
    "is_sample",
    "created_by",
    "created_at",
    "updated_at",
  ),
  mosques: columns<MosqueRow>()(
    "id",
    "name",
    "address",
    "city",
    "country",
    "location",
    "lat",
    "lng",
    "website",
    "timezone",
    "verified",
    "created_by",
    "created_at",
  ),
  recitations: columns<RecitationRow>()(
    "id",
    "reciter_id",
    "mosque_id",
    "surah",
    "ayah_start",
    "ayah_end",
    "audio_url",
    "duration_sec",
    "recorded_at",
    "prayer",
    "status",
    "rejection_reason",
    "is_sample",
    "created_by",
    "created_at",
    "updated_at",
    "approved_at",
  ),
  reflections: columns<ReflectionRow>()(
    "id",
    "recitation_id",
    "question_key",
    "answer_text",
    "favourite_surah",
    "favourite_ayah",
    "created_at",
  ),
  reports: columns<ReportRow>()(
    "id",
    "recitation_id",
    "reciter_id",
    "reason",
    "details",
    "created_by",
    "resolved",
    "created_at",
  ),
  plays: columns<PlayRow>()("id", "recitation_id", "played_at"),
} satisfies Record<keyof Database["tadabbur"]["Tables"], string[]>;

const EXPECTED_ENUMS: { [K in keyof Database["tadabbur"]["Enums"]]: Database["tadabbur"]["Enums"][K][] } = {
  user_role: ["listener", "reciter", "admin"],
  prayer: [
    "fajr",
    "dhuhr",
    "asr",
    "maghrib",
    "isha",
    "jumuah",
    "taraweeh",
    "qiyam",
    "eid",
    "halaqah",
    "other",
  ],
  recitation_status: ["draft", "pending", "approved", "rejected"],
  reflection_key: ["why_surah", "favourite_ayah", "where_learned", "what_it_means"],
  report_reason: ["wrong_data", "inappropriate", "removal_request", "other"],
};

let db: PGlite;
beforeAll(async () => {
  db = await createDb();
});

describe("schema matches lib/database.types.ts", () => {
  it("creates nothing in the shared public schema", async () => {
    const { rows } = await db.query(
      "select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'v', 'S')",
    );
    expect(rows).toEqual([]);
  });

  it.each(Object.entries(EXPECTED_COLUMNS))("%s columns", async (table, expected) => {
    const { rows } = await db.query<{ column_name: string }>(
      "select column_name from information_schema.columns where table_schema = 'tadabbur' and table_name = $1",
      [table],
    );
    expect(rows.map((r) => r.column_name).sort()).toEqual(expected);
  });

  it.each(Object.entries(EXPECTED_ENUMS))("%s enum values", async (name, expected) => {
    const { rows } = await db.query<{ v: string }>(
      "select e.enumlabel as v from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = $1 and t.typnamespace = 'tadabbur'::regnamespace order by e.enumsortorder",
      [name],
    );
    expect(rows.map((r) => r.v)).toEqual(expected);
  });

  it("enables row-level security on every tadabbur table", async () => {
    const { rows } = await db.query<{ relname: string; relrowsecurity: boolean }>(
      "select relname, relrowsecurity from pg_class where relnamespace = 'tadabbur'::regnamespace and relkind = 'r'",
    );
    expect(rows.length).toBe(7);
    for (const r of rows) expect(r.relrowsecurity, r.relname).toBe(true);
  });
});

describe("ayah range validation", () => {
  it("surah_ayah_count() matches the bundled Tanzil metadata for all 114 surahs", async () => {
    const { rows } = await db.query<{ n: number; c: number }>(
      "select n, tadabbur.surah_ayah_count(n) as c from generate_series(1, 114) n order by n",
    );
    expect(rows.map((r) => r.c)).toEqual(SURAHS.map((s) => s.ayahCount));
  });
});

describe("seed", () => {
  it("supabase/seed.sql is up to date with data/seed/london.ts", () => {
    const file = readFileSync(new URL("../../supabase/seed.sql", import.meta.url), "utf8");
    expect(file).toBe(toSql(buildSeedRows()));
  });

  it("loads, and loads again without duplicating", async () => {
    const sql = toSql(buildSeedRows());
    await db.exec(sql);
    await db.exec(sql);
    const { rows } = await db.query<Record<string, number>>(`select
      (select count(*)::int from tadabbur.mosques) as mosques,
      (select count(*)::int from tadabbur.reciters where is_sample) as reciters,
      (select count(*)::int from tadabbur.recitations where is_sample and status = 'approved') as recitations,
      (select count(*)::int from tadabbur.reflections) as reflections`);
    expect(rows[0]).toEqual({ mosques: 12, reciters: 12, recitations: 12, reflections: 36 });
  });

  it("stores London wall-clock times correctly across BST", async () => {
    const { rows } = await db.query<{ name: string; local: string }>(`
      select rc.name, to_char(r.recorded_at at time zone 'Europe/London', 'YYYY-MM-DD HH24:MI') as local
      from tadabbur.recitations r join tadabbur.reciters rc on rc.id = r.reciter_id
      where rc.name in ('Yusuf Rahman', 'Hamza Siddiqui', 'Sumaya Patel') order by rc.name`);
    expect(rows).toEqual([
      { name: "Hamza Siddiqui", local: "2026-03-08 21:30" }, // GMT
      { name: "Sumaya Patel", local: "2026-03-26 02:15" }, // GMT, three days before BST starts
      { name: "Yusuf Rahman", local: "2026-09-14 20:41" }, // BST
    ]);
  });
});
