import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * The public client. Uses only the anon key, which is safe to ship: row-level security
 * decides what it can read and write. There is no server, so this is the only client the
 * site uses. Returns null when the env vars are missing so the UI can show a friendly state.
 */
export const supabase =
  url && anonKey
    ? createClient<Database, "tadabbur">(url, anonKey, {
        db: { schema: "tadabbur" },
        auth: { persistSession: false },
      })
    : null;
