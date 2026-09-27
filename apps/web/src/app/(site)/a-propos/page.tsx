import type { Metadata } from 'next';
import { ProjectImage } from '@/components/media/ProjectImage';
import { AxisFrame } from '@/components/plan/AxisFrame';
import { Container } from '@/components/ui/Container';
import { api } from '@/lib/api';
import styles from './a-propos.module.css';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Histoire de l’entreprise, parcours de l’équipe dirigeante et étapes clés.',
  alternates: { canonical: '/a-propos' },
};

export default async function AboutPage() {
  const [settings, experiences] = await Promise.all([api.settings(), api.experiences()]);
  const { profile } = settings;
  const bio = paragraphsOf(profile.bio);
  const paragraphs = paragraphsOf(settings.company.description);

  return (
    <>
      <Container className={styles.intro}>
        <AxisFrame columns={['A', 'B', 'C']} rows={['1']}>
          <div className={styles.introContent}>
            <h1>À propos</h1>
            {paragraphs.length > 0 ? (
              <div className={styles.text}>
                {paragraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            ) : (
              settings.company.tagline && <p className={styles.text}>{settings.company.tagline}</p>
            )}
          </div>
        </AxisFrame>
      </Container>

      {(experiences.length > 0 || profile.photo) && (
        <Container className={styles.body}>
          {/* Fiche du dirigeant, à droite de la frise sur grand écran (§4.5 : parcours du dirigeant). */}
          {profile.photo && (
            <aside className={styles.leader} aria-labelledby="dirigeant-titre">
              <div className={styles.portrait}>
                <ProjectImage media={profile.photo} sizes="(min-width: 64rem) 22rem, 100vw" cover />
              </div>
              <div className={styles.leaderText}>
                <h2 id="dirigeant-titre" className={styles.leaderName}>
                  {settings.company.name}
                </h2>
                {profile.role && <p className={styles.leaderRole}>{profile.role}</p>}
                {bio.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            </aside>
          )}
          {experiences.length > 0 && (
            <section className={styles.timelineSection} aria-labelledby="parcours-titre">
              <h2 id="parcours-titre">Parcours</h2>
              {/* Séquence chronologique réelle : numérotation autorisée (§4.5). */}
              <ol className={styles.timeline}>
                {experiences.map((e, i) => (
                  <li key={e.id} className={styles.step}>
                    <span className={`${styles.marker} num`} aria-hidden="true">
                      {i + 1}
                    </span>
                    <p className={`${styles.period} num`}>{e.period}</p>
                    <h3 className={styles.title}>{e.title}</h3>
                    {(e.organization || e.location) && (
                      <p className={styles.meta}>{[e.organization, e.location].filter(Boolean).join(' · ')}</p>
                    )}
                    {e.description && <p>{e.description}</p>}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </Container>
      )}
    </>
  );
}

/** Texte saisi dans l'admin → paragraphes (séparés par une ligne vide). */
function paragraphsOf(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}
