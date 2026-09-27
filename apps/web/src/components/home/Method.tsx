import { Container } from '@/components/ui/Container';
import styles from './Method.module.css';

// Séquence réelle d'un chantier : la numérotation est ici légitime (§3.1, §4.1 point 5).
const STEPS = [
  {
    title: 'Étude',
    text: 'Visite du site, relevés, étude de sol si nécessaire, puis chiffrage détaillé poste par poste.',
  },
  {
    title: 'Conception',
    text: 'Plans d’exécution, notes de calcul et planning validés avec le maître d’ouvrage avant le premier coup de pioche.',
  },
  {
    title: 'Exécution',
    text: 'Chantier conduit par un chef de chantier présent chaque jour, avec un point d’avancement hebdomadaire.',
  },
  {
    title: 'Livraison',
    text: 'Réception contradictoire, levée des réserves et remise du dossier des ouvrages exécutés.',
  },
];

export function Method() {
  return (
    <Container as="section" className={styles.section} aria-labelledby="methode-titre">
      <h2 id="methode-titre">Méthode de travail</h2>
      <ol className={styles.steps}>
        {STEPS.map((step, i) => (
          <li key={step.title} className={styles.step}>
            <span className={`${styles.number} num`} aria-hidden="true">
              {i + 1}
            </span>
            <h3 className={styles.title}>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </Container>
  );
}
