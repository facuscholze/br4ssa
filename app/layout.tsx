import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Work_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { CustomCursor } from "@/components/motion/custom-cursor";
import { Toaster } from "@/components/ui/sonner";
import { MEDIA, MENU_TABS, REVIEWS, SITE, STATS, withBasePath } from "@/lib/data";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const workSans = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const OG_DESCRIPTION =
  "Carnes sobre fuego real, pastas caseras y una experiencia gastronómica premium. Reservá tu mesa.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${SITE.name} | ${SITE.tagline}`,
    description: OG_DESCRIPTION,
    type: "website",
    url: SITE.url,
    siteName: SITE.name,
    locale: "es_AR",
    images: [
      {
        url: MEDIA.ogImage.src,
        width: MEDIA.ogImage.width,
        height: MEDIA.ogImage.height,
        alt: `${SITE.name} — ${SITE.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: OG_DESCRIPTION,
    images: [MEDIA.ogImage.src],
  },
  icons: {
    icon: [{ url: withBasePath("/icon.svg"), type: "image/svg+xml" }],
    apple: [{ url: withBasePath("/apple-touch-icon.png"), sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7f0" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
};

const RESTAURANT_ID = `${SITE.url}/#restaurant`;
const rating = STATS.find((stat) => stat.label === "Rating promedio")?.value;

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": RESTAURANT_ID,
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  image: new URL(MEDIA.heroBackground, SITE.url).toString(),
  servesCuisine: ["Parrilla", "Argentina", "Italiana"],
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Av. Principal 123",
    addressLocality: "Ciudad",
    addressCountry: "AR",
  },
  telephone: SITE.phone,
  email: SITE.email,
  acceptsReservations: `${SITE.url}/#reservas`,
  openingHours: "Mo-Su 12:00-24:00",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "12:00",
      closes: "24:00",
    },
  ],
  hasMenu: {
    "@type": "Menu",
    name: `Carta de ${SITE.name}`,
    url: `${SITE.url}/#menu`,
    hasMenuSection: MENU_TABS.map((tab) => ({
      "@type": "MenuSection",
      name: tab.label,
      hasMenuItem: tab.items.map((item) => ({
        "@type": "MenuItem",
        name: item.name,
        description: item.description,
        offers: {
          "@type": "Offer",
          price: item.price.replace(/[^\d]/g, ""),
          priceCurrency: "ARS",
        },
      })),
    })),
  },
  ...(rating !== undefined && {
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 5,
      reviewCount: REVIEWS.length,
    },
  }),
  review: REVIEWS.map((entry) => ({
    "@type": "Review",
    author: { "@type": "Person", name: entry.name },
    reviewRating: {
      "@type": "Rating",
      ratingValue: entry.rating,
      bestRating: 5,
    },
    reviewBody: entry.quote,
  })),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      suppressHydrationWarning
      className={`${fraunces.variable} ${workSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
      </head>
      <body className="min-h-svh antialiased">
        <a
          href="#main"
          className="sr-only rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:ring-3 focus:ring-ring/50 focus:outline-none"
        >
          Saltar al contenido
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <MotionProvider>{children}</MotionProvider>
          <CustomCursor />
          <Toaster richColors position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
