import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/ContactForm';
import { Cartouche } from '@/components/plan/Cartouche';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import { formatPhone, whatsappUrl } from '@/lib/site';
import styles from './contact.module.css';

export const metadata: Metadata = {
  title: 'Contact et devis',
  description: 'Demandez un devis pour votre chantier en Guinée : formulaire, téléphone ou WhatsApp.',
  alternates: { canonical: '/contact' },
};

export default async function ContactPage() {
  const [settings, categories] = await Promise.all([api.settings(), api.categories()]);
  const { contact } = settings;

  return (
    <Container className={styles.page}>
      <h1>Demander un devis</h1>
      <p className={styles.lead}>
        Décrivez le chantier : nous vous rappelons pour préciser le besoin, puis nous établissons un chiffrage.
      </p>

      <div className={styles.grid}>
        <aside className={styles.aside} aria-labelledby="direct-titre">
          <h2 id="direct-titre" className={styles.h2}>
            Contact direct
          </h2>
          {contact.whatsapp && (
            <Button
              href={whatsappUrl(contact.whatsapp, 'Bonjour, je souhaite un devis pour un projet.')}
              external
              variant="plein"
              icon="whatsapp"
              block
              className={styles.whatsapp}
            >
              Écrire sur WhatsApp
            </Button>
          )}
          <Cartouche
            title="Coordonnées"
            rows={[
              {
                label: 'Téléphone',
                value: contact.phone && <a href={`tel:${contact.phone}`}>{formatPhone(contact.phone)}</a>,
              },
              { label: 'Email', value: contact.email && <a href={`mailto:${contact.email}`}>{contact.email}</a> },
              { label: 'Adresse', value: contact.address },
              { label: 'Horaires', value: contact.hours },
            ]}
          />
          {contact.mapUrl && (
            // Lien vers Google Maps plutôt qu'une carte intégrée : aucune iframe lourde chargée (§4.6).
            <Button href={contact.mapUrl} external variant="trait" icon="map-pin" block>
              Voir l’itinéraire sur Google Maps
            </Button>
          )}
        </aside>
        <section className={styles.formSection} aria-labelledby="formulaire-titre">
          <h2 id="formulaire-titre" className={styles.h2}>
            Formulaire
          </h2>
          <ContactForm projectTypes={categories.map((c) => c.name)} />
        </section>
      </div>
    </Container>
  );
}
