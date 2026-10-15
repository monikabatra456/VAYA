import './globals.css';

export const metadata = {
  title: 'VAYA — Stand In. Step Out.',
  description:
    "VAYA is an AI-powered travel intelligence platform. Know where to go, when to go, and what's happening when you get there.",
  openGraph: {
    title: 'VAYA — Stand In. Step Out.',
    description: "Know where to go, when to go, and what's happening when you get there.",
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical hero images */}
        <link
          rel="preload"
          as="image"
          href="/hero/valley.webp"
          imageSrcSet="/hero/valley-mobile.webp 767w, /hero/valley.webp 1440w"
          imageSizes="(max-width:767px) 100vw, 100vw"
        />
        <link rel="preload" as="image" href="/hero/plane.webp" />

        {/* Fonts with font-display: swap */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ── First-frame Inline Preloader CSS (Background white, zero black flash) ── */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #ffffff !important;
                margin: 0;
                padding: 0;
              }
              #vaya-static-preloader {
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                height: 100svh;
                z-index: 999999;
                background: #ffffff;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                transition: opacity 0.4s ease, visibility 0.4s ease;
                pointer-events: none;
              }
              .static-pl-inner {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
              }
              .static-pl-word {
                font-family: 'Outfit', sans-serif;
                font-size: 1.55rem;
                font-weight: 700;
                color: #0B2D5B;
                letter-spacing: 0.14em;
                margin-top: 1rem;
              }
              .static-pl-tag {
                font-family: 'Outfit', sans-serif;
                font-size: 0.85rem;
                font-weight: 500;
                color: #27B2C9;
                letter-spacing: 0.08em;
                margin-top: 0.35rem;
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Instant first-frame static preloader */}
        <div id="vaya-static-preloader" aria-hidden="true">
          <div className="static-pl-inner">
            <svg viewBox="0 0 64 72" width="68" height="76" aria-hidden="true">
              <defs>
                <linearGradient id="spl-vg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B2D5B" />
                  <stop offset="100%" stopColor="#27B2C9" />
                </linearGradient>
              </defs>
              <path
                d="M4,6 L32,44 L60,6"
                fill="none"
                stroke="url(#spl-vg)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10,52 L32,24 L54,52 Z"
                fill="none"
                stroke="url(#spl-vg)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10,52 Q21,46 32,48 Q43,46 54,52 Z"
                fill="#F6A81C"
              />
              <path
                d="M54,10 Q50,28 32,38"
                fill="none"
                stroke="#27B2C9"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                strokeLinecap="round"
              />
              <g transform="translate(54,10) scale(0.85)">
                <path
                  d="M-5,0 L2,0 Q5,-1.5 5,0 Q5,1.5 2,0 L-5,0 Z M-5,0 L-7,-2 L-7,-1 Z M-5,0 L-7,2 L-7,1 Z"
                  fill="#F6A81C"
                />
              </g>
            </svg>
            <div className="static-pl-word">VAYA</div>
            <div className="static-pl-tag">Stand In. Step Out.</div>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
