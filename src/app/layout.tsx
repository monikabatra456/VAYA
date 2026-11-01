import type { Metadata } from "next";
import { Suspense } from "react";
import TrackingProvider from "@/components/TrackingProvider";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "VAYA — Know Before You Go",
  description: "VAYA — A cinematic scroll-driven journey through the world's most beautiful destinations. Know before you go.",
  openGraph: {
    title: "VAYA — Know Before You Go",
    description: "Discover crowd levels, seasonal conditions, and local insights before you travel.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Google Fonts — loaded at runtime by browser, not at build time */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@200;300;400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload Wonder World 3D Globe Earth textures to prevent black flash */}
        <link rel="preload" as="image" href="/wonder/earth-4k.webp" type="image/webp" />
        <link rel="preload" as="image" href="/wonder/earth-2k.webp" type="image/webp" />
      </head>
      <body>
        <Suspense fallback={null}>
          <TrackingProvider />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
