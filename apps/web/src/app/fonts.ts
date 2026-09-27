import { Barlow, Barlow_Condensed } from 'next/font/google';

// Auto-hébergées par next/font au build, sous-ensemble latin (couvre les accents français).
export const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-barlow',
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
  variable: '--font-barlow-condensed',
});
