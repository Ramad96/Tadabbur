import { Fragment } from "react";
import { ayahMarker } from "@/lib/quran/surahs";
import type { AyahRange } from "@/lib/quran/text";

type Props = {
  range: AyahRange;
  /** Visual size; the Arabic always keeps its generous ~1.9 line height. */
  size?: "hero" | "body";
  showTranslation?: boolean;
  /** Off for a single quoted ayah (e.g. a favourite), where a basmala heading would mislead. */
  withBasmala?: boolean;
};

/**
 * Renders ayah text exactly as it comes from the bundled Tanzil source. Nothing here
 * transforms the strings: no trimming, no case or letter-spacing CSS, no font features.
 */
export function AyahText({ range, size = "hero", showTranslation = true, withBasmala = true }: Props) {
  const arabicSize = size === "hero" ? "text-[clamp(28px,4.4vw,42px)]" : "text-[22px]";

  return (
    <div className="flex flex-col gap-4">
      <div lang="ar" dir="rtl" className={`ayah text-center ${arabicSize}`}>
        {withBasmala && range.basmala && (
          <p data-basmala className="text-muted mb-2 text-[0.8em]">
            {range.basmala}
          </p>
        )}
        <p>
          {range.ayahs.map((a) => (
            <Fragment key={a.n}>
              <span data-ayah={a.n}>{a.ar}</span>{" "}
              <span className="text-lamp" aria-hidden="true">
                {ayahMarker(a.n)}
              </span>{" "}
            </Fragment>
          ))}
        </p>
      </div>
      {showTranslation && (
        <p className="font-display text-muted mx-auto max-w-[52ch] text-center text-xl [text-wrap:balance] italic">
          {range.ayahs.map((a) => a.en).join(" ")}
        </p>
      )}
    </div>
  );
}
