import type { SiteSettings } from '@btp/shared';
import Link from 'next/link';
import { Cartouche } from '@/components/plan/Cartouche';
import { PlanSurface } from '@/components/plan/PlanSurface';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { formatPhone, whatsappUrl } from '@/lib/site';
import styles from './SiteFooter.module.css';

/** Pied de page : appel à l'action final et coordonnées dans un cartouche de plan (§4.1, point 6). */
export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { company, contact, social } = settings;
  const socials = Object.entries({
    Facebook: social.facebook,
    LinkedIn: social.linkedin,
    Instagram: social.instagram,
    YouTube: social.youtube,
  }).filter(([, url]) => url);

  return (
    <PlanSurface as="footer" grid className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.cta}>
          <p className={styles.ctaTitle}>Un chantier à lancer ?</p>
          <p>Décrivez-nous le projet : nature des travaux, lieu, délai. Nous revenons vers vous avec un chiffrage.</p>
          <div className={styles.actions}>
            <Button href="/contact" variant="devis">
              Demander un devis
            </Button>
            {contact.whatsapp && (
              <Button
                href={whatsappUrl(contact.whatsapp, 'Bonjour, je souhaite un devis pour un projet.')}
                external
                variant="plan"
                icon="whatsapp"
              >
                Écrire sur WhatsApp
              </Button>
            )}
          </div>
        </div>

        <Cartouche
          tone="plan"
          title={company.name}
          className={styles.cartouche}
          rows={[
            { label: 'Adresse', value: contact.address },
            {
              label: 'Téléphone',
              value: contact.phone && <a href={`tel:${contact.phone}`}>{formatPhone(contact.phone)}</a>,
            },
            { label: 'Email', value: contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a> },
            { label: 'Horaires', value: contact.hours },
            {
              label: 'Réseaux',
              value: socials.length > 0 && (
                <span className={styles.socials}>
                  {socials.map(([name, url]) => (
                    <a key={name} href={url} target="_blank" rel="noopener noreferrer">
                      {name}
                    </a>
                  ))}
                </span>
              ),
            },
          ]}
        />
        <p className={styles.legal}>
          <span>
            © {new Date().getFullYear()} {company.name}
          </span>
          <Link href="/mentions-legales">Mentions légales</Link>
        </p>
      </Container>
    </PlanSurface>
  );
}
