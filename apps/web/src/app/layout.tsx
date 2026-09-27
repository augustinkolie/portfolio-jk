import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@/styles/tokens.css';
import '@/styles/base.css';
import { SkipLink } from '@/components/ui/SkipLink';
import { barlow, barlowCondensed } from './fonts';

export const metadata: Metadata = {
  title: { default: 'Jérôme Kolié', template: '%s — Jérôme Kolié' },
};

export const viewport: Viewport = {
  themeColor: '#1d4a73',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
