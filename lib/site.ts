/** Where reciters and mosques send removal requests. Public; NEXT_PUBLIC_CONTACT_EMAIL overrides it. */
export const CONTACT_EMAIL: string | null =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "amanahdigital1447@gmail.com";

export function removalHref(reciterName: string) {
  if (!CONTACT_EMAIL) return "/privacy/#removal";
  const subject = encodeURIComponent(`Removal request: ${reciterName}`);
  const body = encodeURIComponent(
    `Please remove the recitation(s) and profile for ${reciterName} from Tadabbur.\n\nPage: ${typeof location === "undefined" ? "" : location.href}\n`,
  );
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
