import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'sportsBFF — Meet your sports BFF.',
  description:
    'sportsBFF is the friend who actually knows the league — every player, every piece of gossip, every rule. Point your camera at any game. Ask anything. Learn the NFL and NBA without the gatekeeping. Closed beta on iOS + web.',
  themeColor: '#0D2D24',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'sportsBFF',
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
