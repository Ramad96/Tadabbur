import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-line text-muted mt-16 flex flex-col gap-2 border-t pt-6 text-sm">
      <p>
        Qur&rsquo;an text from the{" "}
        <a className="hover:text-fg underline" href="https://tanzil.net" rel="noopener">
          Tanzil Project
        </a>
        , reproduced verbatim. English translation by M. M. Pickthall (1930), public domain.
      </p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1">
        <Link href="/upload/" className="hover:text-fg underline">
          Share a recitation <span className="label">soon</span>
        </Link>
        <Link href="/about/" className="hover:text-fg underline">
          About us
        </Link>
        <Link href="/privacy/" className="hover:text-fg underline">
          Privacy
        </Link>
      </nav>
      <p className="label">Sample data for London · audio coming soon</p>
    </footer>
  );
}
