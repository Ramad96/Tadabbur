/**
 * The Supabase REST response for approved recitations, built from the seed data. Unit tests
 * parse it; Playwright serves it in place of the network so e2e runs need no database.
 */
import { buildSeedRows } from "./rows.ts";
import { MOSQUES } from "./london.ts";

export function apiRecitationsResponse() {
  const { mosques, reciters, recitations, reflections } = buildSeedRows();
  // Same order as the real query: .order("recorded_at", { ascending: false })
  const newestFirst = [...recitations].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  return newestFirst.map((r) => {
    const reciter = reciters.find((x) => x.id === r.reciter_id)!;
    const mosque = mosques.find((m) => m.id === r.mosque_id)!;
    const coords = MOSQUES[mosques.indexOf(mosque)];
    return {
      id: r.id,
      surah: r.surah,
      ayah_start: r.ayah_start,
      ayah_end: r.ayah_end,
      audio_url: r.audio_url,
      duration_sec: r.duration_sec,
      recorded_at: r.recorded_at,
      prayer: r.prayer,
      is_sample: r.is_sample,
      reciter: {
        id: reciter.id,
        name: reciter.name,
        photo_url: reciter.photo_url,
        bio: reciter.bio,
        age_range: reciter.age_range,
        occupation: reciter.occupation,
        heritage: reciter.heritage,
      },
      mosque: {
        id: mosque.id,
        name: mosque.name,
        address: mosque.address,
        city: mosque.city,
        country: mosque.country,
        lat: coords.lat,
        lng: coords.lng,
        timezone: mosque.timezone,
        website: mosque.website,
      },
      reflections: reflections
        .filter((f) => f.recitation_id === r.id)
        .map((f) => ({
          question_key: f.question_key,
          answer_text: f.answer_text,
          favourite_surah: f.favourite_surah,
          favourite_ayah: f.favourite_ayah,
        })),
    };
  });
}
