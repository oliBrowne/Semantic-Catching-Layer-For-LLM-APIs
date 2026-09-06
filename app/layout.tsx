import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'for you.',
  description: 'There were some things I wanted you to keep.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // The browser chrome should disappear into the same dark as the page.
  themeColor: '#080808',
  width: 'device-width',
  initialScale: 1,
  // Deliberately not capping the scale. The writing is vector strokes and
  // cannot be resized by the reader any other way, so pinching to zoom is the
  // only way in for anyone who needs it larger.
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
