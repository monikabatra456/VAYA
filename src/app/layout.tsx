import type { Metadata } from "next";
import "./globals.css";

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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        {/* Google Fonts — loaded at runtime by browser, not at build time */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@200;300;400;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
