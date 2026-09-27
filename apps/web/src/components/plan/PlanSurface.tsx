import type { ElementType, ReactNode } from 'react';
import styles from './PlanSurface.module.css';

interface PlanSurfaceProps {
  children: ReactNode;
  as?: ElementType;
  /** Quadrillage fin de tirage de plan, en plus du grain. */
  grid?: boolean;
  className?: string;
  'aria-labelledby'?: string;
}

/**
 * Aplat cyanotype (§3.3) : bloc chiffres, sections fortes, pied de page.
 * Le grain est un bruit SVG inline, aucune image n'est téléchargée (§3.5).
 */
export function PlanSurface({
  children,
  as: Tag = 'section',
  grid = false,
  className,
  ...rest
}: PlanSurfaceProps) {
  return (
    <Tag
      className={[styles.surface, grid && styles.grid, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
