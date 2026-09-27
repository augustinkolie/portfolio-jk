import { DimensionLine } from '@/components/plan/DimensionLine';
import { ActionLink, Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import styles from './NotFoundContent.module.css';

/** Page 404 dans le langage du site : une cote qui ne mesure rien. */
export function NotFoundContent() {
  return (
    <Container className={styles.wrap}>
      <DimensionLine size="chiffre" className={styles.dim}>
        404
      </DimensionLine>
      <h1>Cette page ne figure pas sur le plan</h1>
      <p className={styles.text}>
        L’adresse a peut-être changé, ou le projet a été retiré. Les réalisations publiées sont toutes
        accessibles depuis la liste.
      </p>
      <div className={styles.actions}>
        <Button href="/realisations" variant="plein">
          Voir les réalisations
        </Button>
        <ActionLink href="/">Retour à l’accueil</ActionLink>
      </div>
    </Container>
  );
}
