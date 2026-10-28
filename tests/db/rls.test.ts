/**
 * Row-level security, proven against the real migration in an in-memory Postgres.
 * Each check runs inside a rolled-back transaction as a Supabase API role would:
 *   anon           a signed-out visitor using the public anon key
 *   authenticated  a signed-in user (auth.uid() from the JWT)
 */
import type { PGlite, Transaction } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { buildSeedRows, toSql } from "@/data/seed/rows";
import { anon, as, createDb, user } from "./harness";

const ALICE = "11111111-1111-4111-8111-111111111111"; // ordinary uploader
const BOB = "22222222-2222-4222-8222-222222222222"; // another uploader
const ADMIN = "33333333-3333-4333-8333-333333333333";

const SEED = buildSeedRows();
const APPROVED = SEED.recitations[0].id;
const MOSQUE = SEED.mosques[0].id;
const RECITER = SEED.reciters[0].id;
const PENDING = "44444444-4444-4444-8444-444444444444";
const PENDING_RECITER = "55555555-5555-4555-8555-555555555555";
const ALICE_DRAFT = "66666666-6666-4666-8666-666666666666";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
  await db.exec(toSql(SEED));
  await db.exec(`
    insert into auth.users (id, email) values
      ('${ALICE}', 'alice@example.com'), ('${BOB}', 'bob@example.com'), ('${ADMIN}', 'admin@example.com');
    insert into tadabbur.profiles (id, role) values ('${ALICE}', 'listener'), ('${BOB}', 'listener'), ('${ADMIN}', 'admin');

    -- A consenting reciter whose only recitation is still pending review.
    insert into tadabbur.reciters (id, name, consent_public, created_by) values ('${PENDING_RECITER}', 'Pending Person', true, '${BOB}');
    insert into tadabbur.recitations (id, reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, status, created_by)
      values ('${PENDING}', '${PENDING_RECITER}', '${MOSQUE}', 1, 1, 7, '/a.wav', now(), 'fajr', 'pending', '${BOB}');
    insert into tadabbur.reflections (recitation_id, question_key, answer_text) values ('${PENDING}', 'why_surah', 'hidden');

    insert into tadabbur.recitations (id, reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, status, created_by)
      values ('${ALICE_DRAFT}', '${RECITER}', '${MOSQUE}', 112, 1, 4, '/a.wav', now(), 'isha', 'draft', '${ALICE}');
  `);
});

const count = async (tx: Transaction, sql: string, params: unknown[] = []) =>
  (await tx.query<{ n: number }>(`select count(*)::int as n from (${sql}) q`, params)).rows[0].n;

/** Runs one statement as `who` and returns the error code it fails with (or null). */
async function errorCode(who: Parameters<typeof as>[1], sql: string, params: unknown[] = []) {
  try {
    await as(db, who, (tx) => tx.query(sql, params));
    return null;
  } catch (e) {
    return (e as { code?: string }).code ?? "unknown";
  }
}

/** Runs one write as `who`, returning how many rows it affected. */
const affected = (who: Parameters<typeof as>[1], sql: string, params: unknown[] = []) =>
  as(db, who, async (tx) => (await tx.query(sql, params)).affectedRows ?? 0);

const INSERTS: Record<string, string> = {
  profiles: `insert into tadabbur.profiles (id) values ('${ALICE}')`,
  reciters: `insert into tadabbur.reciters (name, consent_public) values ('Intruder', true)`,
  mosques: `insert into tadabbur.mosques (name, city, country, location) values ('X', 'Y', 'Z', 'SRID=4326;POINT(0 0)')`,
  recitations: `insert into tadabbur.recitations (reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, status)
                values ('${RECITER}', '${MOSQUE}', 1, 1, 1, '/x.wav', now(), 'fajr', 'approved')`,
  reflections: `insert into tadabbur.reflections (recitation_id, question_key, answer_text) values ('${APPROVED}', 'what_it_means', 'x')`,
  reports: `insert into tadabbur.reports (recitation_id, reason) values ('${APPROVED}', 'other')`,
  plays: `insert into tadabbur.plays (recitation_id) values ('${APPROVED}')`,
  "storage.objects": `insert into storage.objects (bucket_id, name) values ('tadabbur-audio', 'anon/evil.mp3')`,
};

describe("signed-out visitors (anon)", () => {
  it("see the 12 approved sample recitations with their reciters, mosques and reflections", async () => {
    await as(db, anon, async (tx) => {
      expect(await count(tx, "select * from tadabbur.recitations")).toBe(12);
      expect(await count(tx, "select * from tadabbur.reciters")).toBe(12);
      expect(await count(tx, "select * from tadabbur.mosques")).toBe(12);
      expect(await count(tx, "select * from tadabbur.reflections")).toBe(36);
    });
  });

  it("cannot see pending or draft recitations, their reflections, or a reciter with nothing approved", async () => {
    await as(db, anon, async (tx) => {
      expect(await count(tx, "select * from tadabbur.recitations where status <> 'approved'")).toBe(0);
      expect(await count(tx, "select * from tadabbur.reflections where recitation_id = $1", [PENDING])).toBe(
        0,
      );
      expect(await count(tx, "select * from tadabbur.reciters where id = $1", [PENDING_RECITER])).toBe(0);
    });
  });

  it("cannot read profiles, reports or plays", async () => {
    await as(db, anon, async (tx) => {
      for (const t of ["profiles", "reports", "plays"])
        expect(await count(tx, `select * from tadabbur.${t}`), t).toBe(0);
    });
  });

  it.each(Object.entries(INSERTS))("cannot insert into %s", async (_table, sql) => {
    expect(await errorCode(anon, sql)).toBe("42501"); // insufficient_privilege / RLS violation
  });

  it("cannot update or delete anything", async () => {
    for (const t of ["recitations", "reciters", "mosques", "reflections"]) {
      expect(await affected(anon, `update tadabbur.${t} set created_at = now()`), `update ${t}`).toBe(0);
      expect(await affected(anon, `delete from tadabbur.${t}`), `delete ${t}`).toBe(0);
    }
    expect(await errorCode(anon, "update tadabbur.profiles set role = 'admin'")).toBe("42501");
  });

  it("can record an anonymous play of an approved recitation, and nothing else", async () => {
    await as(db, anon, async (tx) => {
      await tx.query("select tadabbur.record_play($1)", [APPROVED]);
      await tx.query("select tadabbur.record_play($1)", [PENDING]);
    });
    // Count as the superuser, outside the rolled-back transaction above: nothing persisted.
    expect((await db.query<{ n: number }>("select count(*)::int as n from tadabbur.plays")).rows[0].n).toBe(
      0,
    );
    await db.transaction(async (tx) => {
      await tx.exec("set local role anon");
      await tx.query("select tadabbur.record_play($1)", [APPROVED]);
      await tx.query("select tadabbur.record_play($1)", [PENDING]);
      await tx.exec("reset role");
      const { rows } = await tx.query<{ id: string }>("select recitation_id as id from tadabbur.plays");
      expect(rows).toEqual([{ id: APPROVED }]);
      await tx.rollback();
    });
  });
});

describe("mosques_with_counts(bbox)", () => {
  const LONDON = [-0.6, 51.25, 0.35, 51.75];

  it("returns all 12 London mosques with their approved counts", async () => {
    const rows = await as(
      db,
      anon,
      async (tx) =>
        (
          await tx.query<{ name: string; recitation_count: number }>(
            "select * from tadabbur.mosques_with_counts($1, $2, $3, $4)",
            LONDON,
          )
        ).rows,
    );
    expect(rows).toHaveLength(12);
    // East London Mosque also hosts the pending one, which must not be counted.
    expect(rows.find((r) => r.name === "East London Mosque")?.recitation_count).toBe(1);
    expect(rows.every((r) => Number(r.recitation_count) === 1)).toBe(true);
  });

  it("only returns mosques inside the box", async () => {
    const around = (lng: number, lat: number) => [lng - 0.01, lat - 0.01, lng + 0.01, lat + 0.01];
    const rows = await as(db, anon, async (tx) => ({
      elm: (
        await tx.query(
          "select * from tadabbur.mosques_with_counts($1, $2, $3, $4)",
          around(-0.06538, 51.51738),
        )
      ).rows,
      paris: (
        await tx.query("select * from tadabbur.mosques_with_counts($1, $2, $3, $4)", around(2.35, 48.85))
      ).rows,
    }));
    expect(rows.elm).toHaveLength(1);
    expect(rows.paris).toHaveLength(0);
  });
});

describe("signed-in uploaders", () => {
  it("can create a draft for themselves", async () => {
    const sql = `insert into tadabbur.recitations (reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, created_by)
                 values ($1, $2, 94, 5, 6, '/x.wav', now(), 'isha', $3)`;
    expect(await affected(user(ALICE), sql, [RECITER, MOSQUE, ALICE])).toBe(1);
  });

  it("cannot self-approve, write as someone else, add sample data or verify a mosque", async () => {
    const base = `insert into tadabbur.recitations (reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, status, created_by, is_sample)
                  values ($1, $2, 94, 5, 6, '/x.wav', now(), 'isha', $3, $4, $5)`;
    expect(await errorCode(user(ALICE), base, [RECITER, MOSQUE, "approved", ALICE, false])).toBe("42501");
    expect(await errorCode(user(ALICE), base, [RECITER, MOSQUE, "draft", BOB, false])).toBe("42501");
    expect(await errorCode(user(ALICE), base, [RECITER, MOSQUE, "draft", ALICE, true])).toBe("42501");
    expect(
      await errorCode(
        user(ALICE),
        `insert into tadabbur.mosques (name, city, country, location, verified) values ('M', 'C', 'K', 'SRID=4326;POINT(0 0)', true)`,
      ),
    ).toBe("42501");
  });

  it("can submit their own draft as pending, but not approve it or edit it afterwards", async () => {
    await as(db, user(ALICE), async (tx) => {
      const submit = await tx.query("update tadabbur.recitations set status = 'pending' where id = $1", [
        ALICE_DRAFT,
      ]);
      expect(submit.affectedRows).toBe(1);
      const edit = await tx.query("update tadabbur.recitations set surah = 1, ayah_end = 1 where id = $1", [
        ALICE_DRAFT,
      ]);
      expect(edit.affectedRows).toBe(0); // no longer a draft
    });
    expect(
      await errorCode(user(ALICE), "update tadabbur.recitations set status = 'approved' where id = $1", [
        ALICE_DRAFT,
      ]),
    ).toBe("42501");
  });

  it("cannot see or touch another uploader's work", async () => {
    await as(db, user(BOB), async (tx) => {
      expect(await count(tx, "select * from tadabbur.recitations where id = $1", [ALICE_DRAFT])).toBe(0);
    });
    expect(
      await affected(user(BOB), "update tadabbur.recitations set surah = 1 where id = $1", [ALICE_DRAFT]),
    ).toBe(0);
    expect(await affected(user(BOB), "delete from tadabbur.recitations where id = $1", [ALICE_DRAFT])).toBe(
      0,
    );
  });

  it("can create their own profile at first sign-in, but only as a listener", async () => {
    const NEW = "77777777-7777-4777-8777-777777777777";
    await db.query("insert into auth.users (id) values ($1) on conflict do nothing", [NEW]);
    const put = "insert into tadabbur.profiles (id, role) values ($1, $2)";
    expect(await affected(user(NEW), put, [NEW, "listener"])).toBe(1);
    expect(await errorCode(user(NEW), put, [NEW, "admin"])).toBe("42501");
    expect(await errorCode(user(NEW), put, [ALICE, "listener"])).toBe("42501");
  });

  it("can rename themselves but not change their role", async () => {
    expect(
      await affected(user(ALICE), "update tadabbur.profiles set display_name = 'Alice' where id = $1", [
        ALICE,
      ]),
    ).toBe(1);
    expect(
      await errorCode(user(ALICE), "update tadabbur.profiles set role = 'admin' where id = $1", [ALICE]),
    ).toBe("42501");
  });

  it("can only upload files into their own storage folder", async () => {
    const put = "insert into storage.objects (bucket_id, name) values ('tadabbur-audio', $1)";
    expect(await errorCode(user(ALICE), put, [`${ALICE}/take1.mp3`])).toBeNull();
    expect(await errorCode(user(ALICE), put, [`${BOB}/take1.mp3`])).toBe("42501");
  });
});

describe("admins", () => {
  it("see the moderation queue and can approve, which stamps approved_at", async () => {
    await as(db, user(ADMIN), async (tx) => {
      expect(await count(tx, "select * from tadabbur.recitations where status = 'pending'")).toBe(1);
      const { rows } = await tx.query<{ approved_at: string | null }>(
        "update tadabbur.recitations set status = 'approved' where id = $1 returning approved_at",
        [PENDING],
      );
      expect(rows[0].approved_at).not.toBeNull();
    });
  });
});

describe("data rules", () => {
  it("rejects an ayah range longer than the surah", async () => {
    const code = await errorCode(
      user(ALICE),
      `insert into tadabbur.recitations (reciter_id, mosque_id, surah, ayah_start, ayah_end, audio_url, recorded_at, prayer, created_by)
       values ($1, $2, 112, 1, 5, '/x.wav', now(), 'fajr', $3)`,
      [RECITER, MOSQUE, ALICE],
    );
    expect(code).toBe("23514"); // check_violation
  });

  it("refuses a photo without photo consent", async () => {
    const code = await errorCode(
      user(ALICE),
      "insert into tadabbur.reciters (name, photo_url, consent_photo, created_by) values ('P', 'https://x/p.jpg', false, $1)",
      [ALICE],
    );
    expect(code).toBe("23514");
  });
});
