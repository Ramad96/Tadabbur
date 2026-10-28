import { hashString, initials } from "@/lib/format";

type Props = { id: string; name: string; photoUrl?: string | null; size: number };

/**
 * A reciter's face only appears when they uploaded a photo with consent (the database refuses a
 * photo without it). Otherwise: an eight-point star tile with their initials, coloured by id.
 */
export function StarAvatar({ id, name, photoUrl, size }: Props) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static export: no image optimisation server
      <img src={photoUrl} alt="" width={size} height={size} className="flex-none rounded-xl object-cover" />
    );
  }
  const hue = hashString(id) % 360;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="flex-none rounded-xl">
      <rect width="40" height="40" fill={`hsl(${hue} 38% 30%)`} />
      <g fill={`hsl(${hue} 45% 50%)`} opacity=".55">
        <rect x="8" y="8" width="24" height="24" />
        <rect x="8" y="8" width="24" height="24" transform="rotate(45 20 20)" />
      </g>
      <text
        x="20"
        y="24.5"
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize="12"
        fontWeight="600"
        fill="#fff"
      >
        {initials(name)}
      </text>
    </svg>
  );
}
