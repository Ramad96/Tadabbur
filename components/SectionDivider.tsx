/**
 * DS-02 Titled Divider: the section name centred on a thin line, `———— NAME ————`.
 * A real heading for screen readers; lines and label come from theme tokens.
 */
export function SectionDivider({
  title,
  id,
  as: H = "h2",
}: {
  title: string;
  id?: string;
  as?: "h2" | "h3";
}) {
  return (
    <H
      id={id}
      className="text-muted flex items-center gap-3.5 text-center text-xs font-medium tracking-[0.12em] uppercase before:h-px before:min-w-6 before:flex-1 before:bg-[var(--line)] before:content-[''] after:h-px after:min-w-6 after:flex-1 after:bg-[var(--line)] after:content-['']"
    >
      {title}
    </H>
  );
}
