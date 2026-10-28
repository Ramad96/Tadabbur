/**
 * Database types in the shape `supabase gen types typescript` produces, written by hand from
 * supabase/migrations because the project has no direct database connection.
 * tests/db/schema.test.ts compares these against the real migrated schema, so drift fails CI.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "listener" | "reciter" | "admin";
export type Prayer =
  | "fajr"
  | "dhuhr"
  | "asr"
  | "maghrib"
  | "isha"
  | "jumuah"
  | "taraweeh"
  | "qiyam"
  | "eid"
  | "halaqah"
  | "other";
export type RecitationStatus = "draft" | "pending" | "approved" | "rejected";
export type ReflectionKey = "why_surah" | "favourite_ayah" | "where_learned" | "what_it_means";
export type ReportReason = "wrong_data" | "inappropriate" | "removal_request" | "other";

type Table<Row, Required extends keyof Row, Generated extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required | Generated>>;
  Update: Partial<Omit<Row, Generated>>;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
};

export type ReciterRow = {
  id: string;
  profile_id: string | null;
  name: string;
  photo_url: string | null;
  bio: string | null;
  age_range: string | null;
  occupation: string | null;
  heritage: string | null;
  consent_public: boolean;
  consent_photo: boolean;
  is_sample: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MosqueRow = {
  id: string;
  name: string;
  address: string | null;
  city: string;
  country: string;
  /** PostGIS geography(Point). Write as "SRID=4326;POINT(lng lat)"; read lat/lng instead. */
  location: unknown;
  lat: number;
  lng: number;
  website: string | null;
  /** IANA time zone, e.g. "Europe/London". Recitation times display in the mosque's local time. */
  timezone: string;
  verified: boolean;
  created_by: string | null;
  created_at: string;
};

export type RecitationRow = {
  id: string;
  reciter_id: string;
  mosque_id: string;
  surah: number;
  ayah_start: number;
  ayah_end: number;
  /** Full URL for uploads; site-relative path (e.g. /audio/sample-silence.wav) for samples. */
  audio_url: string;
  duration_sec: number | null;
  recorded_at: string;
  prayer: Prayer;
  status: RecitationStatus;
  rejection_reason: string | null;
  is_sample: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
};

export type ReflectionRow = {
  id: string;
  recitation_id: string;
  question_key: ReflectionKey;
  answer_text: string | null;
  favourite_surah: number | null;
  favourite_ayah: number | null;
  created_at: string;
};

export type ReportRow = {
  id: string;
  recitation_id: string | null;
  reciter_id: string | null;
  reason: ReportReason;
  details: string | null;
  created_by: string | null;
  resolved: boolean;
  created_at: string;
};

export type PlayRow = {
  id: number;
  recitation_id: string;
  played_at: string;
};

export type MosqueWithCount = {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  verified: boolean;
  recitation_count: number;
};

export type Database = {
  /** Everything lives in its own schema; the Supabase project is shared with another app. */
  tadabbur: {
    Tables: {
      profiles: Table<ProfileRow, "id", "created_at">;
      reciters: Table<ReciterRow, "name", "created_at" | "updated_at">;
      mosques: Table<MosqueRow, "name" | "city" | "country" | "location", "lat" | "lng" | "created_at">;
      recitations: Table<
        RecitationRow,
        | "reciter_id"
        | "mosque_id"
        | "surah"
        | "ayah_start"
        | "ayah_end"
        | "audio_url"
        | "recorded_at"
        | "prayer",
        "created_at" | "updated_at" | "approved_at"
      >;
      reflections: Table<ReflectionRow, "recitation_id" | "question_key", "created_at">;
      reports: Table<ReportRow, "reason", "created_at">;
      plays: Table<PlayRow, "recitation_id", "id" | "played_at">;
    };
    Views: { [_ in never]: never };
    Functions: {
      mosques_with_counts: {
        Args: { min_lng: number; min_lat: number; max_lng: number; max_lat: number };
        Returns: MosqueWithCount[];
      };
      record_play: { Args: { recitation: string }; Returns: undefined };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      surah_ayah_count: { Args: { s: number }; Returns: number };
    };
    Enums: {
      user_role: UserRole;
      prayer: Prayer;
      recitation_status: RecitationStatus;
      reflection_key: ReflectionKey;
      report_reason: ReportReason;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
