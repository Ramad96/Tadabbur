# Qur'an data sources

Files in this folder are verbatim downloads. Do not edit them; `pnpm quran:build`
derives everything in `data/quran/surahs.json` and `public/quran/` from them, and
`tests/unit/quran-integrity.test.ts` checks the derived files against these.

| File | Source | Licence |
| --- | --- | --- |
| `quran-uthmani.txt` | https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&marks=true&sajdah=true&rub=false&tatweel=true&agree=true | Tanzil Quran Text (Uthmani, v1.1), CC BY 3.0, verbatim only, credit and link to tanzil.net |
| `en.pickthall.txt` | https://tanzil.net/trans/?transID=en.pickthall&type=txt-2 | M. M. Pickthall, *The Meaning of the Glorious Koran* (1930). Translator died 1936; public domain. Digitised by Tanzil. |
| `quran-data.js` | https://tanzil.net/res/text/metadata/quran-data.js | Tanzil metadata, CC BY 3.0 |

Downloaded 2026-10-23.
