import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { api } from '@/lib/api';
import { SITE_URL } from '@/lib/site';

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await api.settings();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: company.name, template: `%s — ${company.name}` },
    description: company.tagline || undefined,
    openGraph: { siteName: company.name, locale: 'fr_GN', type: 'website' },
  };
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await api.settings();
  return (
    <>
      <SiteHeader companyName={settings.company.name} />
      <main id="contenu">{children}</main>
      <SiteFooter settings={settings} />
      <WhatsAppButton phone={settings.contact.whatsapp} />
    </>
  );
}
