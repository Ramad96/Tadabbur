"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutUs } from "./about/AboutUs";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Listen" },
  { href: "/map/", label: "Map" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href.replace(/\/$/, ""));
}

/** about: the About content, rendered on the server with its ayahs, shown in the About sheet. */
export function Header({ about }: { about: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header className="border-line flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b pt-7 pb-5">
      <Link href="/" className="flex flex-wrap items-baseline gap-4 rounded-md">
        <span
          lang="ar"
          dir="rtl"
          className="font-brand text-lamp text-[clamp(46px,8vw,72px)] leading-none font-bold"
        >
          تَدَبُّر
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-display text-[26px] tracking-[0.01em]">Tadabbur</span>
          <span className="text-muted text-sm">Hear the Qur&rsquo;an in the voices of the living.</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <nav aria-label="Main" className="border-line bg-panel flex gap-1 rounded-full border p-1">
          {NAV.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-5 py-2 font-medium ${
                  active ? "bg-lamp text-lamp-ink" : "text-muted hover:text-fg"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <AboutUs>{about}</AboutUs>
        <ThemeToggle />
      </div>
    </header>
  );
}
