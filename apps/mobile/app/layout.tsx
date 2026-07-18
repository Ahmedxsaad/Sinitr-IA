import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

// Inter for body/UI, Space Grotesk for display headings. Both are loaded
// through next/font, which self-hosts the files in the build output, so the
// demo stays fully offline once built.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Sinistr'IA - Report an accident",
  description: 'Derja-first guided accident reporting.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="aurora-bg">{children}</body>
    </html>
  );
}
