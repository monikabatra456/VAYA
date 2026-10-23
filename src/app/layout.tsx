import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jakarta",
  display: "swap",
});

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
    <html lang="en" className={`${outfit.variable} ${jakarta.variable}`}>
      <head />
      <body>
        {children}
      </body>
    </html>
  );
}
