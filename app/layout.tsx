import type { Metadata, Viewport } from "next";
import { Aref_Ruqaa, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif } from "next/font/google";
import localFont from "next/font/local";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

// The wordmark is decorative: don't let it compete with the ayah font for bandwidth.
const aref = Aref_Ruqaa({ weight: "700", subsets: ["arabic"], variable: "--font-aref", preload: false });
// Amiri Regular subset to the Qur'an's own characters (42 KB, not 105 KB). See scripts/subset-amiri.py.
const amiri = localFont({
  src: "./fonts/amiri-quran.woff2",
  weight: "400",
  variable: "--font-amiri",
  adjustFontFallback: false,
});
const instrument = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument",
});
const plexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  // Preload Latin only; Latin Extended (e.g. the ı in Yıldız) still loads on demand via unicode-range.
  subsets: ["latin"],
  variable: "--font-plex-sans",
});
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex-mono",
  preload: false, // small labels only; not worth competing with the ayah font
});

export const metadata: Metadata = {
  metadataBase: new URL("https://tadabbur.amanahdigital.co.uk"),
  title: { default: "Tadabbur · تَدَبُّر", template: "%s · Tadabbur" },
  description:
    "Hear the Qur'an in the voices of the living: recitations from people who pray in mosques around the world.",
  openGraph: {
    siteName: "Tadabbur",
    locale: "en_GB",
    images: [
      {
        url: "/og/site.png",
        width: 1200,
        height: 630,
        alt: "Tadabbur: hear the Qur'an in the voices of the living",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#0e1819",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const fonts = [aref, amiri, instrument, plexSans, plexMono].map((f) => f.variable).join(" ");

  return (
    // The theme script may set data-theme before hydration.
    <html lang="en" className={`${fonts} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-dvh px-[max(16px,env(safe-area-inset-left))] pb-12">
        <a
          href="#main"
          className="bg-lamp text-lamp-ink sr-only rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <PlayerProvider>
          <div className="mx-auto max-w-[1180px]">
            <Header />
            <main id="main" tabIndex={-1} className="focus:outline-none">
              {children}
            </main>
            <Footer />
          </div>
          <MiniPlayer />
        </PlayerProvider>
      </body>
    </html>
  );
}
