import Link from "next/link";
import { LiveFallback } from "@/components/detail/LiveFallback";

export default function NotFound() {
  return (
    <LiveFallback>
      <section className="py-24 text-center">
        <p className="label">404</p>
        <h1 className="font-display mt-2 text-4xl">This page is not here</h1>
        <p className="text-muted mt-3">It may have been removed, or the link is mistyped.</p>
        <Link href="/" className="btn-ghost mt-6">
          Back to Listen
        </Link>
      </section>
    </LiveFallback>
  );
}
