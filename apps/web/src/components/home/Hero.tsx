import type { ProjectSummaryDto, SiteSettings } from '@btp/shared';
import Link from 'next/link';
import { ProjectImage } from '@/components/media/ProjectImage';
import { AxisFrame } from '@/components/plan/AxisFrame';
import { DimensionLine } from '@/components/plan/DimensionLine';
import { ActionLink, Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import styles from './Hero.module.css';

interface HeroProps {
  company: SiteSettings['company'];
  /** Projet phare : premier projet publié marqué « en vedette ». */
  project: ProjectSummaryDto | null;
}

/**
 * Hero : la photo du projet phare encadrée de ses vraies cotes, tracées au chargement
 * (seule animation orchestrée du site, §3.6). Horizontale : surface ou linéaire ;
 * verticale : durée des travaux.
 */
export function Hero({ company, project }: HeroProps) {
  const cover = project?.cover ?? null;
  return (
    <Container className={styles.wrap}>
      <AxisFrame columns={['A', 'B', 'C', 'D']} rows={['1', '2']}>
        <div className={styles.grid}>
          {project && cover && (
            <figure className={styles.figure}>
              {project.size && (
                <DimensionLine draw className={styles.dimTop}>
                  {project.size}
                </DimensionLine>
              )}
              <div className={styles.photoRow}>
                <div className={styles.photo}>
                  <ProjectImage
                    media={cover}
                    sizes="(min-width: 64rem) 60vw, 100vw"
                    priority
                    cover
                  />
                </div>
                {project.duration && (
                  <DimensionLine
                    orientation="vertical"
                    draw
                    delay={0.25}
                    className={styles.dimSide}
                  >
                    {project.duration}
                  </DimensionLine>
                )}
              </div>
              <figcaption className={styles.caption}>
                <Link href={`/realisations/${project.slug}`}>{project.title}</Link>
                <span>
                  {project.location}, <span className="num">{project.year}</span>
                </span>
              </figcaption>
            </figure>
          )}

          <div className={styles.text}>
            <h1 className={styles.name}>{company.name}</h1>
            {company.tagline && <p className={styles.tagline}>{company.tagline}</p>}
            <div className={styles.actions}>
              <Button href="/contact" variant="devis">
                Demander un devis
              </Button>
              <ActionLink href="/realisations">Voir les réalisations</ActionLink>
            </div>
          </div>
        </div>
      </AxisFrame>
    </Container>
  );
}

