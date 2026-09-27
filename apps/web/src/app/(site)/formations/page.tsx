import { PAGE_SIZE } from '@btp/shared';
import type { Metadata } from 'next';
import { CoursesBrowser } from '@/components/training/CoursesBrowser';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import styles from './formations.module.css';

export const metadata: Metadata = {
  title: 'Formations',
  description:
    'Formations aux logiciels du bâtiment (AutoCAD, Revit…) en salle ou en direct, avec extraits vidéo et inscription en ligne.',
  alternates: { canonical: '/formations' },
};

// Séquence réelle d'inscription : la numérotation est légitime (§3.1).
const STEPS = [
  { title: 'Choisissez', text: 'Regardez l’extrait vidéo et le programme de la formation.' },
  { title: 'Demandez', text: 'Envoyez votre demande d’inscription avec votre numéro.' },
  { title: 'Confirmez', text: 'Nous vous rappelons pour confirmer la place et le paiement.' },
  { title: 'Apprenez', text: 'Cours en salle ou en direct en ligne, selon la formation.' },
];

export default async function CoursesPage() {
  const courses = await api.courses({ limit: PAGE_SIZE });

  return (
    <Container className={styles.page}>
      <h1>Formations</h1>
      <p className={styles.lead}>
        Apprendre les logiciels du bâtiment avec un professionnel du terrain : dessin, modélisation et calcul de
        structure, sur des projets réels.
      </p>

      <ol className={styles.steps} aria-label="Comment s’inscrire">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <span className={`${styles.number} num`} aria-hidden="true">
              {i + 1}
            </span>
            <span className={styles.stepTitle}>{s.title}</span>
            <span className={styles.stepText}>{s.text}</span>
          </li>
        ))}
      </ol>

      {courses.total === 0 ? (
        <p className={styles.empty}>Les prochaines formations seront bientôt annoncées ici.</p>
      ) : (
        <CoursesBrowser initial={courses} gridClassName={styles.grid} />
      )}
    </Container>
  );
}
