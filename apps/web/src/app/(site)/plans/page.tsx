import { PAGE_SIZE } from '@btp/shared';
import type { Metadata } from 'next';
import { PlansBrowser } from '@/components/training/PlansBrowser';
import { ActionLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import styles from './plans.module.css';

export const metadata: Metadata = {
  title: 'Plans de conception',
  description: 'Plans de villas, duplex et immeubles conçus par Jérôme Kolié. Commandez un plan adapté à votre terrain.',
  alternates: { canonical: '/plans' },
};

export default async function PlansPage() {
  const plans = await api.plans({ limit: PAGE_SIZE });

  return (
    <Container className={styles.page}>
      <h1>Plans de conception</h1>
      <div className={styles.intro}>
        <p className={styles.lead}>
          Villas, duplex et immeubles : une sélection de plans conçus pour le climat et les terrains guinéens.
        </p>
        <ActionLink href="/contact">Commander un plan pour votre terrain</ActionLink>
      </div>

      {plans.total === 0 ? (
        <p className={styles.empty}>Les premiers plans seront bientôt publiés ici.</p>
      ) : (
        <PlansBrowser initial={plans} gridClassName={styles.grid} />
      )}
    </Container>
  );
}
