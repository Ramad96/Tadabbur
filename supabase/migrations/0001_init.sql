-- Tadabbur: initial schema.
-- Run once in the Supabase dashboard: SQL Editor → New query → paste this file → Run.
-- Then expose the schema to the API: Project Settings → Data API → Exposed schemas → add "tadabbur".
--
-- Everything lives in its own "tadabbur" schema because this Supabase project is shared with
-- another app. Nothing here touches the public schema or adds triggers to auth.users.
--
-- Access model
--   Signed-out visitors: read approved content only. No direct writes to any table.
--   Signed-in uploaders: create drafts, edit their own drafts, submit them as pending.
--   Admins (profiles.role = 'admin'): everything.
-- Every table has row-level security on. tests/db/rls.test.ts proves the rules.

create extension if not exists postgis with schema extensions;

-- Fails if the schema already exists, so this file can never half-apply over an earlier run.
create schema tadabbur;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type tadabbur.user_role as enum ('listener', 'reciter', 'admin');
create type tadabbur.prayer as enum (
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah', 'taraweeh', 'qiyam', 'eid', 'halaqah', 'other'
);
create type tadabbur.recitation_status as enum ('draft', 'pending', 'approved', 'rejected');
create type tadabbur.reflection_key as enum ('why_surah', 'favourite_ayah', 'where_learned', 'what_it_means');
create type tadabbur.report_reason as enum ('wrong_data', 'inappropriate', 'removal_request', 'other');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Ayah counts for surahs 1–114, generated from data/quran/surahs.json (Tanzil metadata).
-- tests/db/schema.test.ts fails if this ever drifts from the bundled data.
create function tadabbur.surah_ayah_count(s integer)
returns integer
language sql
immutable
parallel safe
set search_path = ''
as $$
  select (array[
    7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6
  ]::integer[])[s]
$$;

create function tadabbur.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table tadabbur.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role tadabbur.user_role not null default 'listener',
  created_at timestamptz not null default now()
);

create table tadabbur.reciters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references tadabbur.profiles (id) on delete set null,
  name text not null check (char_length(name) between 1 and 120),
  photo_url text,
  bio text check (char_length(bio) <= 1000),
  age_range text check (char_length(age_range) <= 20),
  occupation text check (char_length(occupation) <= 120),
  heritage text check (char_length(heritage) <= 200),
  consent_public boolean not null default false,
  consent_photo boolean not null default false,
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A photo can only be stored once photo consent is recorded.
  constraint photo_needs_consent check (photo_url is null or consent_photo)
);

create table tadabbur.mosques (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 160),
  address text check (char_length(address) <= 300),
  city text not null check (char_length(city) between 1 and 100),
  country text not null check (char_length(country) between 1 and 100),
  location extensions.geography(point, 4326) not null,
  lat double precision generated always as (extensions.st_y(location::extensions.geometry)) stored,
  lng double precision generated always as (extensions.st_x(location::extensions.geometry)) stored,
  website text check (char_length(website) <= 300),
  verified boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create table tadabbur.recitations (
  id uuid primary key default gen_random_uuid(),
  reciter_id uuid not null references tadabbur.reciters (id) on delete cascade,
  mosque_id uuid not null references tadabbur.mosques (id) on delete restrict,
  surah smallint not null check (surah between 1 and 114),
  ayah_start smallint not null,
  ayah_end smallint not null,
  audio_url text not null,
  duration_sec integer check (duration_sec between 1 and 900),
  recorded_at timestamptz not null,
  prayer tadabbur.prayer not null,
  status tadabbur.recitation_status not null default 'draft',
  rejection_reason text check (char_length(rejection_reason) <= 500),
  is_sample boolean not null default false,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  constraint valid_ayah_range check (
    ayah_start >= 1 and ayah_end >= ayah_start and ayah_end <= tadabbur.surah_ayah_count(surah)
  )
);

create table tadabbur.reflections (
  id uuid primary key default gen_random_uuid(),
  recitation_id uuid not null references tadabbur.recitations (id) on delete cascade,
  question_key tadabbur.reflection_key not null,
  answer_text text check (char_length(answer_text) <= 1000),
  favourite_surah smallint check (favourite_surah between 1 and 114),
  favourite_ayah smallint,
  created_at timestamptz not null default now(),
  unique (recitation_id, question_key),
  constraint has_answer check (answer_text is not null or favourite_surah is not null),
  constraint valid_favourite check (
    (favourite_surah is null and favourite_ayah is null)
    or (favourite_ayah between 1 and tadabbur.surah_ayah_count(favourite_surah))
  )
);

create table tadabbur.reports (
  id uuid primary key default gen_random_uuid(),
  recitation_id uuid references tadabbur.recitations (id) on delete cascade,
  reciter_id uuid references tadabbur.reciters (id) on delete cascade,
  reason tadabbur.report_reason not null,
  details text check (char_length(details) <= 2000),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  constraint has_target check (recitation_id is not null or reciter_id is not null)
);

-- Anonymous play counts: no user id, no IP, nothing that identifies a listener.
create table tadabbur.plays (
  id bigint generated always as identity primary key,
  recitation_id uuid not null references tadabbur.recitations (id) on delete cascade,
  played_at timestamptz not null default now()
);

create index on tadabbur.mosques using gist (location);
create index on tadabbur.recitations (status);
create index on tadabbur.recitations (reciter_id);
create index on tadabbur.recitations (mosque_id);
create index on tadabbur.recitations (surah);
create index on tadabbur.reflections (recitation_id);
create index on tadabbur.reports (resolved);
create index on tadabbur.plays (recitation_id);

create trigger reciters_updated_at before update on tadabbur.reciters
  for each row execute function tadabbur.set_updated_at();
create trigger recitations_updated_at before update on tadabbur.recitations
  for each row execute function tadabbur.set_updated_at();

-- ---------------------------------------------------------------------------
-- Roles and profiles
-- ---------------------------------------------------------------------------

create function tadabbur.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from tadabbur.profiles where id = auth.uid() and role = 'admin')
$$;

-- Approval timestamps are set by the database, not the client.
create function tadabbur.stamp_approval()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then
    new.approved_at = now();
  end if;
  return new;
end;
$$;

create trigger recitations_stamp_approval before insert or update on tadabbur.recitations
  for each row execute function tadabbur.stamp_approval();

-- ---------------------------------------------------------------------------
-- API access. A custom schema gets none of Supabase's default grants, so grant the API
-- roles table access here and let row-level security decide what each caller can do.
-- ---------------------------------------------------------------------------

grant usage on schema tadabbur to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema tadabbur to anon, authenticated, service_role;
grant usage, select on all sequences in schema tadabbur to anon, authenticated, service_role;
grant execute on all functions in schema tadabbur to anon, authenticated, service_role;
alter default privileges in schema tadabbur
  grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges in schema tadabbur grant usage, select on sequences to anon, authenticated, service_role;

-- Nobody can change their own role through the API: only display_name is updatable.
revoke update on tadabbur.profiles from anon, authenticated;
grant update (display_name) on tadabbur.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table tadabbur.profiles enable row level security;
alter table tadabbur.reciters enable row level security;
alter table tadabbur.mosques enable row level security;
alter table tadabbur.recitations enable row level security;
alter table tadabbur.reflections enable row level security;
alter table tadabbur.reports enable row level security;
alter table tadabbur.plays enable row level security;

-- profiles: you see and rename yourself; only admins see everyone. Nobody can change
-- their own role through the API (column grant in the API access section).
create policy "profiles: read own" on tadabbur.profiles
  for select using (id = auth.uid() or tadabbur.is_admin());
-- Created by the app at first sign-in (no trigger on the shared auth.users table), always as a listener.
create policy "profiles: create own" on tadabbur.profiles
  for insert to authenticated with check (id = auth.uid() and role = 'listener');
create policy "profiles: update own" on tadabbur.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- reciters: public only with consent and at least one approved recitation.
create policy "reciters: public read" on tadabbur.reciters
  for select using (
    (consent_public and exists (
      select 1 from tadabbur.recitations r where r.reciter_id = reciters.id and r.status = 'approved'
    ))
    or created_by = auth.uid()
    or profile_id = auth.uid()
    or tadabbur.is_admin()
  );
create policy "reciters: create own" on tadabbur.reciters
  for insert to authenticated with check (created_by = auth.uid() and not is_sample);
create policy "reciters: edit own" on tadabbur.reciters
  for update to authenticated
  using (created_by = auth.uid() or profile_id = auth.uid())
  with check (created_by = auth.uid() or profile_id = auth.uid());
create policy "reciters: admin" on tadabbur.reciters
  for all to authenticated using (tadabbur.is_admin()) with check (tadabbur.is_admin());

-- mosques: public when verified or hosting an approved recitation. New ones start unverified.
create policy "mosques: public read" on tadabbur.mosques
  for select using (
    verified
    or exists (select 1 from tadabbur.recitations r where r.mosque_id = mosques.id and r.status = 'approved')
    or created_by = auth.uid()
    or tadabbur.is_admin()
  );
create policy "mosques: create unverified" on tadabbur.mosques
  for insert to authenticated with check (created_by = auth.uid() and not verified);
create policy "mosques: admin" on tadabbur.mosques
  for all to authenticated using (tadabbur.is_admin()) with check (tadabbur.is_admin());

-- recitations: public sees approved only. Uploaders edit drafts and can submit them as pending.
create policy "recitations: public read" on tadabbur.recitations
  for select using (status = 'approved' or created_by = auth.uid() or tadabbur.is_admin());
create policy "recitations: create draft" on tadabbur.recitations
  for insert to authenticated
  with check (created_by = auth.uid() and status in ('draft', 'pending') and not is_sample);
create policy "recitations: edit own draft" on tadabbur.recitations
  for update to authenticated
  using (created_by = auth.uid() and status = 'draft')
  with check (created_by = auth.uid() and status in ('draft', 'pending'));
create policy "recitations: delete own draft" on tadabbur.recitations
  for delete to authenticated using (created_by = auth.uid() and status = 'draft');
create policy "recitations: admin" on tadabbur.recitations
  for all to authenticated using (tadabbur.is_admin()) with check (tadabbur.is_admin());

-- reflections follow their recitation.
create policy "reflections: read with recitation" on tadabbur.reflections
  for select using (exists (select 1 from tadabbur.recitations r where r.id = reflections.recitation_id));
create policy "reflections: write on own draft" on tadabbur.reflections
  for all to authenticated
  using (exists (
    select 1 from tadabbur.recitations r
    where r.id = reflections.recitation_id and r.created_by = auth.uid() and r.status = 'draft'
  ))
  with check (exists (
    select 1 from tadabbur.recitations r
    where r.id = reflections.recitation_id and r.created_by = auth.uid() and r.status = 'draft'
  ));
create policy "reflections: admin" on tadabbur.reflections
  for all to authenticated using (tadabbur.is_admin()) with check (tadabbur.is_admin());

-- reports: signed-in users file them; admins read and resolve.
create policy "reports: create" on tadabbur.reports
  for insert to authenticated with check (created_by = auth.uid() and not resolved);
create policy "reports: read own" on tadabbur.reports
  for select to authenticated using (created_by = auth.uid() or tadabbur.is_admin());
create policy "reports: admin" on tadabbur.reports
  for all to authenticated using (tadabbur.is_admin()) with check (tadabbur.is_admin());

-- plays: no direct access. Counts are written only through record_play() below.
create policy "plays: admin read" on tadabbur.plays
  for select to authenticated using (tadabbur.is_admin());

-- ---------------------------------------------------------------------------
-- Functions the site calls
-- ---------------------------------------------------------------------------

-- Pins for the map: mosques inside a bounding box with their approved recitation count.
create function tadabbur.mosques_with_counts(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision
)
returns table (
  id uuid,
  name text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  verified boolean,
  recitation_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select m.id, m.name, m.city, m.country, m.lat, m.lng, m.verified, count(r.id) as recitation_count
  from tadabbur.mosques m
  join tadabbur.recitations r on r.mosque_id = m.id and r.status = 'approved'
  where m.location operator(extensions.&&) extensions.st_makeenvelope(
    greatest(min_lng, -180), greatest(min_lat, -90), least(max_lng, 180), least(max_lat, 90), 4326
  )::extensions.geography
  group by m.id
$$;

-- Records one anonymous play of an approved recitation. The only write open to signed-out visitors,
-- and it cannot touch anything else.
create function tadabbur.record_play(recitation uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into tadabbur.plays (recitation_id)
  select r.id from tadabbur.recitations r where r.id = recitation and r.status = 'approved'
$$;

grant execute on function tadabbur.record_play(uuid) to anon, authenticated, service_role;
grant execute on function tadabbur.mosques_with_counts(double precision, double precision, double precision, double precision)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage: public-read buckets for audio and photos, prefixed so they can't clash with the other
-- app's buckets. Uploads go into the uploader's own folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('tadabbur-audio', 'tadabbur-audio', true, 26214400,
    array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/webm']),
  ('tadabbur-photos', 'tadabbur-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "tadabbur: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('tadabbur-audio', 'tadabbur-photos') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "tadabbur: delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id in ('tadabbur-audio', 'tadabbur-photos') and (storage.foldername(name))[1] = auth.uid()::text);
