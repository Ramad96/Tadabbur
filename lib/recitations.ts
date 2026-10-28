import { z } from "zod";
import type { Prayer, ReflectionKey } from "./database.types";
import { supabase } from "./supabase";

/**
 * One approved recitation with everything the Listen and Map views show. Parsed with Zod so a
 * schema change on the server fails loudly here instead of rendering half a profile.
 */
const PRAYERS = [
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
] as const;
const REFLECTION_KEYS = ["why_surah", "favourite_ayah", "where_learned", "what_it_means"] as const;

const RowSchema = z.object({
  id: z.string(),
  surah: z.number().int().min(1).max(114),
  ayah_start: z.number().int().min(1),
  ayah_end: z.number().int().min(1),
  audio_url: z.string().min(1),
  duration_sec: z.number().int().nullable(),
  recorded_at: z.string(),
  prayer: z.enum(PRAYERS),
  is_sample: z.boolean(),
  reciter: z.object({
    id: z.string(),
    name: z.string(),
    photo_url: z.string().nullable(),
    bio: z.string().nullable(),
    age_range: z.string().nullable(),
    occupation: z.string().nullable(),
    heritage: z.string().nullable(),
  }),
  mosque: z.object({
    id: z.string(),
    name: z.string(),
    address: z.string().nullable(),
    city: z.string(),
    country: z.string(),
    lat: z.number(),
    lng: z.number(),
    timezone: z.string(),
    website: z.string().nullable(),
  }),
  reflections: z.array(
    z.object({
      question_key: z.enum(REFLECTION_KEYS),
      answer_text: z.string().nullable(),
      favourite_surah: z.number().nullable(),
      favourite_ayah: z.number().nullable(),
    }),
  ),
});

export const SELECT = `
  id, surah, ayah_start, ayah_end, audio_url, duration_sec, recorded_at, prayer, is_sample,
  reciter:reciters!inner ( id, name, photo_url, bio, age_range, occupation, heritage ),
  mosque:mosques!inner ( id, name, address, city, country, lat, lng, timezone, website ),
  reflections ( question_key, answer_text, favourite_surah, favourite_ayah )
`.replace(/\s+/g, " ");

export type Reflection = {
  key: ReflectionKey;
  text: string | null;
  favourite: { surah: number; ayah: number } | null;
};

export type Recitation = {
  id: string;
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  audioUrl: string;
  durationSec: number | null;
  recordedAt: string;
  prayer: Prayer;
  isSample: boolean;
  reciter: {
    id: string;
    name: string;
    photoUrl: string | null;
    bio: string | null;
    ageRange: string | null;
    occupation: string | null;
    heritage: string | null;
  };
  mosque: {
    id: string;
    name: string;
    address: string | null;
    city: string;
    country: string;
    lat: number;
    lng: number;
    timezone: string;
    website: string | null;
  };
  reflections: Reflection[];
};

/** Turns the raw API rows into app objects. Exported for tests and fixtures. */
export function parseRecitations(raw: unknown): Recitation[] {
  return z
    .array(RowSchema)
    .parse(raw)
    .map((r) => ({
      id: r.id,
      surah: r.surah,
      ayahStart: r.ayah_start,
      ayahEnd: r.ayah_end,
      audioUrl: r.audio_url,
      durationSec: r.duration_sec,
      recordedAt: r.recorded_at,
      prayer: r.prayer,
      isSample: r.is_sample,
      reciter: {
        id: r.reciter.id,
        name: r.reciter.name,
        photoUrl: r.reciter.photo_url,
        bio: r.reciter.bio,
        ageRange: r.reciter.age_range,
        occupation: r.reciter.occupation,
        heritage: r.reciter.heritage,
      },
      mosque: r.mosque,
      reflections: r.reflections.map((f) => ({
        key: f.question_key,
        text: f.answer_text,
        favourite:
          f.favourite_surah && f.favourite_ayah ? { surah: f.favourite_surah, ayah: f.favourite_ayah } : null,
      })),
    }));
}

/** All approved recitations, newest first. RLS guarantees only approved rows reach visitors. */
export async function fetchApprovedRecitations(): Promise<Recitation[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("recitations")
    .select(SELECT)
    .eq("status", "approved")
    .order("recorded_at", { ascending: false });
  if (error) throw new Error(error.message);
  return parseRecitations(data);
}
