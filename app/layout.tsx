import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: "Tea'd Up — Your AI Sports BFF.",
  description:
    "Tea'd Up is the friend who has the sports tea. Scan any player, get the gossip — confirmed, reported, speculated, or rumored. Plus the rules in plain English. NFL + NBA, no gatekeeping.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Tea'd Up",
  },
};

// CRITICAL: viewport meta tag. Without this, mobile renders at ~980px and shrinks
// (every iOS Safari user was seeing the desktop layout zoomed out).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFFFFF',
  viewportFit: 'cover', // respect iPhone notch/home-indicator safe areas
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT@0,9..144,400..900,0..100;1,9..144,400..900,0..100&family=Inter:wght@400;500;600;700&family=Caveat:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
