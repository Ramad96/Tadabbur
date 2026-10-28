/**
 * London sample data. The mosques are real (coordinates checked against OpenStreetMap,
 * 2026-10-24); the reciters are fictional and every reciter and recitation is marked
 * is_sample so they can be wiped before launch. Reflections come from the prototype.
 * No Arabic text lives here: favourite ayahs are stored as surah/ayah references and
 * rendered from the bundled Tanzil source.
 */
import type { Prayer } from "@/lib/database.types";

export const SAMPLE_AUDIO_URL = "/audio/sample-silence.wav";

type SeedMosque = {
  key: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  website?: string;
};

type SeedRecitation = {
  reciter: {
    name: string;
    ageRange: string;
    occupation: string;
    heritage: string;
  };
  mosque: string;
  surah: number;
  ayahStart: number;
  ayahEnd: number;
  prayer: Prayer;
  /** Local London wall-clock time, as the prototype shows it. */
  date: string;
  time: string;
  durationSec: number;
  why: string;
  favourite: [surah: number, ayah: number];
  learned: string;
};

export const MOSQUES: SeedMosque[] = [
  {
    key: "elm",
    name: "East London Mosque",
    address: "82–92 Whitechapel Road, E1 1JQ",
    city: "London",
    country: "United Kingdom",
    lat: 51.51738,
    lng: -0.06538,
    website: "https://www.eastlondonmosque.org.uk",
  },
  {
    key: "lcm",
    name: "London Central Mosque",
    address: "146 Park Road, NW8 7RG",
    city: "London",
    country: "United Kingdom",
    lat: 51.52899,
    lng: -0.16507,
    website: "https://www.iccuk.org",
  },
  {
    key: "brx",
    name: "Brixton Mosque",
    address: "1 Gresham Road, SW9 7PH",
    city: "London",
    country: "United Kingdom",
    lat: 51.46533,
    lng: -0.11274,
  },
  {
    key: "hcm",
    name: "Harrow Central Mosque",
    address: "36–38 Station Road, Harrow, HA1 2SQ",
    city: "London",
    country: "United Kingdom",
    lat: 51.58908,
    lng: -0.3322,
    website: "https://harrowmosque.org.uk",
  },
  {
    key: "sul",
    name: "Suleymaniye Mosque",
    address: "212–216 Kingsland Road, E2 8AX",
    city: "London",
    country: "United Kingdom",
    lat: 51.5353,
    lng: -0.07644,
  },
  {
    key: "fpm",
    name: "Finsbury Park Mosque",
    address: "7–11 St Thomas's Road, N4 2QH",
    city: "London",
    country: "United Kingdom",
    lat: 51.56358,
    lng: -0.10568,
    website: "https://finsburyparkmosque.org",
  },
  {
    key: "bfu",
    name: "Baitul Futuh",
    address: "181 London Road, Morden, SM4 5PT",
    city: "London",
    country: "United Kingdom",
    lat: 51.39671,
    lng: -0.19928,
  },
  {
    key: "abm",
    name: "Abu Bakr Masjid",
    address: "165–169 The Broadway, Southall, UB1 1LR",
    city: "London",
    country: "United Kingdom",
    lat: 51.51208,
    lng: -0.38383,
  },
  {
    key: "taw",
    name: "Masjid Tawhid",
    address: "80 High Road Leyton, E15 2BP",
    city: "London",
    country: "United Kingdom",
    lat: 51.55313,
    lng: -0.00463,
    website: "https://www.masjidtawhid.org",
  },
  {
    key: "tic",
    name: "Tooting Islamic Centre",
    address: "127–145 Upper Tooting Road, SW17 7TJ",
    city: "London",
    country: "United Kingdom",
    lat: 51.43248,
    lng: -0.1636,
  },
  {
    key: "iic",
    name: "Ilford Islamic Centre",
    address: "50–58 Albert Road, Ilford, IG1 1HW",
    city: "London",
    country: "United Kingdom",
    lat: 51.55635,
    lng: 0.0749,
  },
  {
    key: "gic",
    name: "Greenwich Islamic Centre",
    address: "131 Plumstead Road, SE18 7DW",
    city: "London",
    country: "United Kingdom",
    lat: 51.49033,
    lng: 0.08267,
  },
];

export const RECITATIONS: SeedRecitation[] = [
  {
    reciter: {
      name: "Yusuf Rahman",
      ageRange: "25–34",
      occupation: "Paramedic",
      heritage: "Born in Tower Hamlets, family from Sylhet",
    },
    mosque: "elm",
    surah: 94,
    ayahStart: 5,
    ayahEnd: 6,
    prayer: "isha",
    date: "2026-09-14",
    time: "20:41",
    durationSec: 96,
    why: "I recite this after long night shifts. It is a promise I need to hear out loud.",
    favourite: [94, 5],
    learned: "My grandfather taught me in Bangladesh before I could read English.",
  },
  {
    reciter: {
      name: "Ibrahim Al-Hashimi",
      ageRange: "55–64",
      occupation: "Retired engineer",
      heritage: "Came to London from Baghdad in 1991",
    },
    mosque: "lcm",
    surah: 55,
    ayahStart: 13,
    ayahEnd: 13,
    prayer: "fajr",
    date: "2026-08-02",
    time: "04:52",
    durationSec: 184,
    why: "At Fajr the hall is quiet. Ar-Rahman fills it with a question I never tire of.",
    favourite: [55, 13],
    learned: "Memorised it as a boy in Adhamiyah. I recite it the way my teacher did.",
  },
  {
    reciter: {
      name: "Amina Okafor",
      ageRange: "25–34",
      occupation: "Architect",
      heritage: "Nigerian-British, raised in Peckham",
    },
    mosque: "brx",
    surah: 93,
    ayahStart: 3,
    ayahEnd: 3,
    prayer: "halaqah",
    date: "2026-10-03",
    time: "11:15",
    durationSec: 72,
    why: "I chose it for a friend going through a hard year. It is a surah of reassurance.",
    favourite: [93, 4],
    learned: "I started tajweed classes at 22. This was my first full surah with proper makharij.",
  },
  {
    reciter: {
      name: "Hamza Siddiqui",
      ageRange: "18–24",
      occupation: "Maths student, UCL",
      heritage: "Grew up in Harrow",
    },
    mosque: "hcm",
    surah: 67,
    ayahStart: 1,
    ayahEnd: 1,
    prayer: "taraweeh",
    date: "2026-03-08",
    time: "21:30",
    durationSec: 240,
    why: "My dad recites Al-Mulk every night. Leading it in Taraweeh felt like giving it back to him.",
    favourite: [67, 2],
    learned: "Hifz completed at 15 at the local madrasah.",
  },
  {
    reciter: {
      name: "Mehmet Yıldız",
      ageRange: "45–54",
      occupation: "Baker",
      heritage: "From Kayseri, in Dalston since 2004",
    },
    mosque: "sul",
    surah: 112,
    ayahStart: 1,
    ayahEnd: 1,
    prayer: "dhuhr",
    date: "2026-07-21",
    time: "13:20",
    durationSec: 38,
    why: "Short, but it holds everything. I recite it between batches at the bakery too.",
    favourite: [112, 1],
    learned: "In Kayseri, from the imam of our neighbourhood masjid.",
  },
  {
    reciter: {
      name: "Abdullah Farah",
      ageRange: "35–44",
      occupation: "Bus driver, Route 29",
      heritage: "Somali-British, lives in Haringey",
    },
    mosque: "fpm",
    surah: 13,
    ayahStart: 28,
    ayahEnd: 28,
    prayer: "asr",
    date: "2026-06-11",
    time: "17:05",
    durationSec: 110,
    why: "London traffic tests your patience. This ayah is how I reset between shifts.",
    favourite: [13, 28],
    learned: "Dugsi in Mogadishu, then Saturday classes in Tottenham.",
  },
  {
    reciter: {
      name: "Naveed Ahmad",
      ageRange: "45–54",
      occupation: "Pharmacist",
      heritage: "Family from Rabwah, lives in Morden",
    },
    mosque: "bfu",
    surah: 1,
    ayahStart: 5,
    ayahEnd: 5,
    prayer: "maghrib",
    date: "2026-05-19",
    time: "20:58",
    durationSec: 64,
    why: "We recite it in every prayer. I wanted to slow down and mean every word.",
    favourite: [1, 6],
    learned: "From my mother at the kitchen table.",
  },
  {
    reciter: {
      name: "Bilal Hussain",
      ageRange: "25–34",
      occupation: "Software developer",
      heritage: "Born in Southall, family from Mirpur",
    },
    mosque: "abm",
    surah: 36,
    ayahStart: 58,
    ayahEnd: 58,
    prayer: "jumuah",
    date: "2026-09-25",
    time: "13:45",
    durationSec: 150,
    why: "Recited for my nani the week after she passed. It is the ayah of greeting in Paradise.",
    favourite: [36, 58],
    learned: "Evening madrasah above a shop on the Broadway.",
  },
  {
    reciter: {
      name: "Khadija Benali",
      ageRange: "25–34",
      occupation: "Primary school teacher",
      heritage: "Moroccan-British, from Leyton",
    },
    mosque: "taw",
    surah: 103,
    ayahStart: 1,
    ayahEnd: 2,
    prayer: "halaqah",
    date: "2026-04-12",
    time: "16:30",
    durationSec: 45,
    why: "I teach this to my pupils' mums. Three ayat that sum up how to live.",
    favourite: [103, 3],
    learned: "Warsh recitation from my father, Hafs from London teachers.",
  },
  {
    reciter: {
      name: "Tariq Mahmood",
      ageRange: "45–54",
      occupation: "Taxi driver",
      heritage: "From Lahore, in Tooting since 1999",
    },
    mosque: "tic",
    surah: 2,
    ayahStart: 186,
    ayahEnd: 186,
    prayer: "taraweeh",
    date: "2026-03-15",
    time: "22:10",
    durationSec: 132,
    why: "It sits in the middle of the fasting ayat. Allah says He is near, right when we are hungry.",
    favourite: [2, 186],
    learned: "Mosque school in Lahore, refreshed with my son's teacher here.",
  },
  {
    reciter: {
      name: "Sumaya Patel",
      ageRange: "18–24",
      occupation: "Junior doctor, Whipps Cross",
      heritage: "Gujarati heritage, raised in Ilford",
    },
    mosque: "iic",
    surah: 39,
    ayahStart: 53,
    ayahEnd: 53,
    prayer: "qiyam",
    date: "2026-03-26",
    time: "02:15",
    durationSec: 118,
    why: "The most hopeful ayah I know. Hospital life needs it.",
    favourite: [39, 53],
    learned: "Weekend madrasah, then an online ijazah course during med school.",
  },
  {
    reciter: {
      name: "Musa Adeyemi",
      ageRange: "35–44",
      occupation: "Electrician",
      heritage: "Yoruba-British, lives in Woolwich",
    },
    mosque: "gic",
    surah: 112,
    ayahStart: 1,
    ayahEnd: 4,
    prayer: "fajr",
    date: "2026-10-10",
    time: "05:58",
    durationSec: 41,
    why: "My son just memorised it. I led Fajr with it so he could hear his surah in the masjid.",
    favourite: [112, 4],
    learned: "From an imam in Ibadan, polished at the Woolwich circle.",
  },
];
