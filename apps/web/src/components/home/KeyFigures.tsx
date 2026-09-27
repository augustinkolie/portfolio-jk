import type { KeyFigure } from '@btp/shared';
import { DimensionLine } from '@/components/plan/DimensionLine';
import { PlanSurface } from '@/components/plan/PlanSurface';
import { Container } from '@/components/ui/Container';
import { figureLengths, formatNumber } from '@/lib/site';
import styles from './KeyFigures.module.css';

/**
 * Bloc chiffres : chaque donnée est une cote dont la longueur croît avec la valeur,
 * sur un tirage cyanotype. Pas de cartes (§4.1, point 2).
 */
export function KeyFigures({ figures }: { figures: KeyFigure[] }) {
  if (figures.length === 0) return null;
  const lengths = figureLengths(figures);

  return (
    <PlanSurface grid className={styles.section} aria-labelledby="chiffres-titre">
      <Container>
        <h2 id="chiffres-titre" className="sr-only">
          L’entreprise en chiffres
        </h2>
        <ul className={styles.list}>
          {figures.map((f, i) => (
            <li key={`${f.label}-${i}`}>
              <DimensionLine tone="plan" size="chiffre" length={lengths[i]}>
                <span className="num">
                  {formatNumber(f.value)}
                  {f.unit && <span className={styles.unit}> {f.unit}</span>}
                </span>
                <span className={styles.label}>{f.label}</span>
              </DimensionLine>
            </li>
          ))}
        </ul>
      </Container>
    </PlanSurface>
  );
}
