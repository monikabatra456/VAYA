import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VAYA — Know Before You Go",
  description: "VAYA — A scroll-driven cinematic journey through alpine landscapes. Know before you go.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <head>
        {/* Priority LCP Preload: Initial hero frame 1 */}
        <link
          rel="preload"
          as="image"
          href="/frames/frame_0001.webp"
          type="image/webp"
        />
      </head>
      <body className="bg-[#f3f2ee] text-[#1e2a3f] antialiased selection:bg-[#1e2a3f] selection:text-[#f3f2ee]">
        {children}
      </body>
    </html>
  );
}
