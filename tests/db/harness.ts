import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PGlite, type Transaction } from "@electric-sql/pglite";
import { postgis } from "@electric-sql/pglite-postgis";

const root = join(import.meta.dirname, "../..");

/** A fresh in-memory Postgres with PostGIS, the Supabase shim and every migration applied. */
export async function createDb() {
  const db = new PGlite({ extensions: { postgis } });
  await db.exec(readFileSync(join(root, "tests/db/supabase-shim.sql"), "utf8"));
  const dir = join(root, "supabase/migrations");
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync(join(dir, file), "utf8"));
  }
  return db;
}

type Who = { role: "anon" } | { role: "authenticated"; userId: string };

/**
 * Runs fn as a Supabase API caller would: switched to the anon or authenticated role, with
 * the JWT claims auth.uid() reads. Always rolled back, so tests never leak state.
 */
export async function as<T>(db: PGlite, who: Who, fn: (tx: Transaction) => Promise<T>): Promise<T> {
  let result!: T;
  await db
    .transaction(async (tx) => {
      const claims = who.role === "anon" ? { role: "anon" } : { role: "authenticated", sub: who.userId };
      await tx.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(claims)]);
      await tx.exec(`set local role ${who.role}`);
      result = await fn(tx);
      throw new Rollback();
    })
    .catch((e) => {
      if (!(e instanceof Rollback)) throw e;
    });
  return result;
}

class Rollback extends Error {}

export const anon = { role: "anon" } as const;
export const user = (userId: string) => ({ role: "authenticated", userId }) as const;
