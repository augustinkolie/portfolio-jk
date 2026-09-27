import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import { formatPhone } from '@/lib/site';
import styles from './mentions.module.css';

export const metadata: Metadata = {
  title: 'Mentions légales',
  alternates: { canonical: '/mentions-legales' },
};

// Les éléments entre crochets sont à fournir par le client (cahier des charges §12).
export default async function LegalPage() {
  const { company, contact } = await api.settings();
  return (
    <Container className={styles.page}>
      <h1>Mentions légales</h1>

      <section>
        <h2>Éditeur du site</h2>
        <p>
          {company.name}, [forme juridique], immatriculée au RCCM sous le numéro [numéro RCCM], NIF
          [numéro NIF].
        </p>
        {contact.address && <p>Siège : {contact.address}.</p>}
        <p>
          {contact.phone && <>Téléphone : {formatPhone(contact.phone)}. </>}
          {contact.email && <>Email : {contact.email}.</>}
        </p>
        <p>Directeur de la publication : [nom et fonction].</p>
      </section>

      <section>
        <h2>Hébergement</h2>
        <p>[Nom de l’hébergeur], [adresse], [téléphone].</p>
      </section>

      <section>
        <h2>Données personnelles</h2>
        <p>
          Les informations envoyées par le formulaire de contact (nom, téléphone, email, description du
          projet) servent uniquement à répondre à votre demande. Elles ne sont ni vendues ni transmises à
          des tiers.
        </p>
        <p>
          Vous pouvez demander leur consultation ou leur suppression en écrivant à{' '}
          {contact.email || 'l’adresse email indiquée ci-dessus'}.
        </p>
        <p>Le site ne dépose aucun cookie de mesure d’audience ni de publicité.</p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes et photographies de ce site appartiennent à {company.name}. Toute reproduction sans
          autorisation écrite est interdite.
        </p>
      </section>
    </Container>
  );
}
